export function calculateWage(
  dailyWage: number,
  worked: boolean,
  isHoliday: boolean,
  overtimeHrs: number,
): number {
  if (!worked) return 0

  const hourlyRate = dailyWage / 8

  if (isHoliday) {
    const base = hourlyRate * 1.5 * 8
    const overtime = overtimeHrs > 0 ? hourlyRate * 2.0 * overtimeHrs : 0
    return Math.round(base + overtime)
  }

  const base = dailyWage
  const overtime = overtimeHrs > 0 ? hourlyRate * 1.5 * overtimeHrs : 0
  return Math.round(base + overtime)
}

export function getWageBreakdown(
  dailyWage: number,
  worked: boolean,
  isHoliday: boolean,
  overtimeHrs: number,
) {
  if (!worked) return { base: 0, overtime: 0, total: 0 }

  const hourlyRate = dailyWage / 8

  if (isHoliday) {
    const base = Math.round(hourlyRate * 1.5 * 8)
    const overtime = overtimeHrs > 0 ? Math.round(hourlyRate * 2.0 * overtimeHrs) : 0
    return { base, overtime, total: base + overtime }
  }

  const base = dailyWage
  const overtime = overtimeHrs > 0 ? Math.round(hourlyRate * 1.5 * overtimeHrs) : 0
  return { base, overtime, total: base + overtime }
}
