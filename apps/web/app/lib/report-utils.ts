export type GoalReportInput = {
  currentCards: number
  goalConfigured: boolean
  goalTargetCards: number
  progressPct: number
}

export type GoalReportSummary = {
  configured: boolean
  targetCards: number | null
  progressPct: number
  remainingCards: number | null
  status: string
}

export type ImprovementInput = GoalReportInput & {
  historyCount: number
  previousCards?: number | null
  inactiveOrganizations?: number
  topThreeShare?: number
}

export function getGoalReportSummary(
  input: GoalReportInput
): GoalReportSummary {
  if (!input.goalConfigured) {
    return {
      configured: false,
      targetCards: null,
      progressPct: 0,
      remainingCards: null,
      status: "Meta não configurada",
    }
  }

  const progressPct = Math.max(0, Math.round(input.progressPct))
  const remainingCards = Math.max(0, input.goalTargetCards - input.currentCards)

  return {
    configured: true,
    targetCards: input.goalTargetCards,
    progressPct,
    remainingCards,
    status: remainingCards === 0 ? "Meta atingida" : "Em andamento",
  }
}

export function buildImprovementItems(input: ImprovementInput): string[] {
  const items: string[] = []
  const targetCards = Math.max(0, input.goalTargetCards)
  const remainingCards = Math.max(0, targetCards - input.currentCards)

  if (!input.goalConfigured) {
    items.push("Definir uma meta para acompanhar o avanço de cartões digitais.")
  } else if (remainingCards > 0) {
    items.push(
      `Aumentar a adesão em ${formatPlainNumber(remainingCards)} ${pluralize(remainingCards, "cartão digital", "cartões digitais")} para atingir a meta.`
    )
  } else {
    items.push("Revisar a meta para manter um alvo acima do patamar atual.")
  }

  if ((input.inactiveOrganizations ?? 0) > 0) {
    const inactiveOrganizations = input.inactiveOrganizations ?? 0
    items.push(
      `Ativar ${formatPlainNumber(inactiveOrganizations)} ${pluralize(inactiveOrganizations, "organização sem histórico", "organizações sem histórico")} para ampliar a cobertura do relatório.`
    )
  }

  if ((input.topThreeShare ?? 0) >= 65) {
    items.push(
      `Reduzir a concentração: as 3 maiores organizações respondem por ${Math.round(input.topThreeShare ?? 0)}% dos cartões digitais.`
    )
  }

  if (input.historyCount < 2) {
    items.push(
      "Registrar atualizações periódicas para tornar a tendência mais confiável."
    )
  }

  if (input.previousCards != null && input.currentCards < input.previousCards) {
    items.push(
      "Retomar o crescimento: a leitura atual ficou abaixo do registro anterior."
    )
  }

  return items.slice(0, 3)
}

function formatPlainNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(
    value
  )
}

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural
}
