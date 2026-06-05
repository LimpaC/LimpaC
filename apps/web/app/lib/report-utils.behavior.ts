import { expect, test } from "bun:test"
import { buildImprovementItems, getGoalReportSummary } from "./report-utils"

test("getGoalReportSummary calcula progresso e saldo restante da meta", () => {
  expect(
    getGoalReportSummary({
      currentCards: 750,
      goalConfigured: true,
      goalTargetCards: 1000,
      progressPct: 75.4,
    })
  ).toEqual({
    configured: true,
    targetCards: 1000,
    progressPct: 75,
    remainingCards: 250,
    status: "Em andamento",
  })
})

test("getGoalReportSummary trata meta não configurada", () => {
  expect(
    getGoalReportSummary({
      currentCards: 300,
      goalConfigured: false,
      goalTargetCards: 5000000,
      progressPct: 0,
    })
  ).toEqual({
    configured: false,
    targetCards: null,
    progressPct: 0,
    remainingCards: null,
    status: "Meta não configurada",
  })
})

test("buildImprovementItems prioriza meta, histórico e crescimento", () => {
  expect(
    buildImprovementItems({
      currentCards: 800,
      goalConfigured: true,
      goalTargetCards: 1000,
      progressPct: 80,
      historyCount: 1,
      previousCards: 850,
    })
  ).toEqual([
    "Aumentar a adesão em 200 cartões digitais para atingir a meta.",
    "Registrar atualizações periódicas para tornar a tendência mais confiável.",
    "Retomar o crescimento: a leitura atual ficou abaixo do registro anterior.",
  ])
})

test("buildImprovementItems inclui alertas administrativos de ativação e concentração", () => {
  expect(
    buildImprovementItems({
      currentCards: 12000,
      goalConfigured: true,
      goalTargetCards: 10000,
      progressPct: 120,
      historyCount: 5,
      inactiveOrganizations: 2,
      topThreeShare: 78,
    })
  ).toEqual([
    "Revisar a meta para manter um alvo acima do patamar atual.",
    "Ativar 2 organizações sem histórico para ampliar a cobertura do relatório.",
    "Reduzir a concentração: as 3 maiores organizações respondem por 78% dos cartões digitais.",
  ])
})
