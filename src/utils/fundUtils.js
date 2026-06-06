export function parseNum(val) {
  return parseFloat(String(val ?? '').replace(/[^0-9.-]/g, '')) || 0
}

export function getDateCol(fund) {
  return fund?.columns?.[0] ?? null
}

// Returns contributor columns — excludes date, amount totals, and FD-specific labels
export function getContributorCols(fund) {
  if (!fund?.columns?.length) return []
  return fund.columns.slice(1).filter(
    (c) => !/^(amount|total|balance|interest gained|account deposit|account withdraw|interest rate|tenure)$/i.test(c.trim())
  )
}

export function getFundTotal(fund) {
  if (!fund?.data?.length || !fund?.columns?.length) return 0

  // Use "Amount" / "Total" / "Balance" column if present (avoids double-counting contributors)
  const totalCol = fund.columns.find((c) => /^(amount|total|balance)$/i.test(c.trim()))
  if (totalCol) {
    return fund.data.reduce((sum, row) => sum + parseNum(row[totalCol]), 0)
  }

  // Fixed deposit: deposits minus withdrawals plus interest
  const depositCol = fund.columns.find((c) => /account deposit/i.test(c))
  const withdrawCol = fund.columns.find((c) => /account withdraw/i.test(c))
  const interestCol = fund.columns.find((c) => /interest gained/i.test(c))
  if (depositCol) {
    return fund.data.reduce((sum, row) =>
      sum + parseNum(row[depositCol]) - parseNum(row[withdrawCol] ?? 0) + parseNum(row[interestCol] ?? 0), 0
    )
  }

  // Fallback: sum all numeric columns except the first (date/label)
  const numCols = fund.columns.slice(1)
  return fund.data.reduce((sum, row) =>
    sum + numCols.reduce((s, col) => s + parseNum(row[col]), 0), 0
  )
}
