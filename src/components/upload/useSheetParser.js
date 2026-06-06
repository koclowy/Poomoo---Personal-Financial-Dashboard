import * as XLSX from 'xlsx'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function isExcelDateSerial(val) {
  return typeof val === 'number' && Number.isFinite(val) && val > 40000 && val < 60000
}

function excelDateToMonth(serial) {
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000))
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

function jsDateToMonth(d) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

// Returns the index of the row that looks most like a real header
function findHeaderRowIndex(rows) {
  let bestIdx = 0
  let bestCount = 0
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] || []
    const count = row.filter(
      (c) => typeof c === 'string' && c.trim() && !/^\d{4}$/.test(c.trim())
    ).length
    if (count > bestCount) {
      bestCount = count
      bestIdx = i
    }
  }
  return bestIdx
}

// Picks column indices from a header row, stopping at 2+ consecutive nulls
function getColumnIndices(headerRow) {
  const indices = []
  const names = []
  let consecutiveNulls = 0

  for (let i = 0; i < headerRow.length; i++) {
    const val = headerRow[i]
    if (val == null || String(val).trim() === '') {
      consecutiveNulls++
      if (consecutiveNulls >= 2 && indices.length >= 2) break
    } else {
      consecutiveNulls = 0
      const name = String(val).trim()
      if (!names.includes(name)) {
        indices.push(i)
        names.push(name)
      }
    }
  }

  return { indices, names }
}

export function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

        const headerIdx = findHeaderRowIndex(rawRows)
        const { indices: colIndices, names: columns } = getColumnIndices(rawRows[headerIdx] || [])

        if (columns.length === 0) throw new Error('Could not detect column headers')

        const data = []
        for (let i = headerIdx + 1; i < rawRows.length; i++) {
          const row = rawRows[i]
          if (!row) continue

          // Skip rows where the first column (date/name/bank) is null or empty
          const firstVal = row[colIndices[0]]
          if (firstVal == null || String(firstVal).trim() === '') continue

          const obj = {}
          colIndices.forEach((ci, j) => {
            let val = row[ci]
            const colName = columns[j]
            if (j === 0 || /date/i.test(colName)) {
              if (val instanceof Date) {
                val = jsDateToMonth(val)
              } else if (isExcelDateSerial(val)) {
                val = excelDateToMonth(val)
              }
            }
            obj[colName] = val ?? ''
          })

          // Skip "Total" / summary rows
          const label = String(obj[columns[0]] ?? '').trim().toLowerCase()
          if (label === 'total' || label === 'grand total') continue

          data.push(obj)
        }

        resolve({ columns, data, rawBuffer: e.target.result })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export function writeXLSX(columns, data) {
  const ws = XLSX.utils.json_to_sheet(data, { header: columns })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
}
