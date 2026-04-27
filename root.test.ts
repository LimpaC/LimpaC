import { test } from "bun:test"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"

import "./apps/web/app/lib/utils.behavior"
import "./apps/web/app/lib/token-cookie.behavior"

function collectFiles(dir: string, predicate: (path: string) => boolean): string[] {
  if (!statSync(dir).isDirectory()) {
    return []
  }

  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      results.push(...collectFiles(path, predicate))
    } else if (predicate(path)) {
      results.push(path)
    }
  }

  return results
}

function joinClasspath(paths: string[]) {
  return paths.join(":")
}

function ensureBackendBuildDir() {
  const buildDir = "/tmp/limpac-backend-classes"
  rmSync(buildDir, { recursive: true, force: true })
  mkdirSync(buildDir, { recursive: true })
  return buildDir
}

function runJavaBackendTests() {
  const buildDir = ensureBackendBuildDir()
  const jarFiles = collectFiles("/home/minelli/.m2/repository", (path) => path.endsWith(".jar"))
  const resourceDirs = [
    "apps/backend/src/main/resources",
    "apps/backend/src/test/resources",
  ].filter((dir) => existsSync(dir))
  const classpath = joinClasspath([buildDir, ...resourceDirs, ...jarFiles])
  const sources = [
    ...collectFiles("apps/backend/src/main/java", (path) => path.endsWith(".java")),
    ...collectFiles("apps/backend/src/test/java", (path) => path.endsWith(".java")),
  ]

  const javacArgsPath = "/tmp/limpac-javac.args"
  const javaArgsPath = "/tmp/limpac-java.args"

  writeFileSync(javacArgsPath, ["-parameters", "-cp", classpath, "-d", buildDir, ...sources].join("\n"))

  const compile = spawnSync("javac", [`@${javacArgsPath}`], { encoding: "utf8" })
  if (compile.status !== 0) {
    throw new Error(
      [
        "Backend Java compilation failed.",
        `status: ${compile.status}`,
        compile.error ? `error: ${compile.error.message}` : null,
        compile.stdout ? `stdout:\n${compile.stdout}` : null,
        compile.stderr ? `stderr:\n${compile.stderr}` : null,
      ]
        .filter(Boolean)
        .join("\n\n")
    )
  }

  writeFileSync(javaArgsPath, ["-cp", classpath, "com.limpac.backend.service.TestRunner"].join("\n"))

  const run = spawnSync(
    "java",
    ["-Djdk.attach.allowAttachSelf=true", "-XX:+EnableDynamicAgentLoading", `@${javaArgsPath}`],
    { encoding: "utf8" }
  )
  if (run.stdout) {
    process.stdout.write(run.stdout)
  }
  if (run.stderr) {
    process.stderr.write(run.stderr)
  }
  if (run.status !== 0) {
    throw new Error(
      [
        "Backend Java test runner failed.",
        `status: ${run.status}`,
        run.error ? `error: ${run.error.message}` : null,
        run.stdout ? `stdout:\n${run.stdout}` : null,
        run.stderr ? `stderr:\n${run.stderr}` : null,
      ]
        .filter(Boolean)
        .join("\n\n")
    )
  }
}

runJavaBackendTests()
