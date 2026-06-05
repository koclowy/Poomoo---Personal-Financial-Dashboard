import * as XLSX from 'xlsx'

export function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(ws)
      const columns = Object.keys(json[0] || {})
      resolve({ columns, data: json, rawBuffer: e.target.result })
    }
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

export function writeXLSX(columns, data) {
  const ws = XLSX.utils.json_to_sheet(data, { header: columns })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
}
