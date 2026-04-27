import { expect, test } from "bun:test"
import { cn } from "./utils"

test("cn combina classes utilitarias conflitantes", () => {
  expect(cn("px-2", "px-4", "text-sm", false && "hidden")).toBe("px-4 text-sm")
})
