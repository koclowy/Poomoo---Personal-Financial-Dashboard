import { useState, useRef } from 'react'
import { parseXLSX } from './useSheetParser'
import { createFund } from '../../firebase/firestore'

const MAX_SIZE = 10 * 1024 * 1024

export default function UploadModal({ dashboardId, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [columns, setColumns] = useState([])
  const [parsedData, setParsedData] = useState([])
  const [fundName, setFundName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef()

  async function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > MAX_SIZE) { setError('File too large (max 10MB)'); return }
    setError(null)
    setFile(f)
    setFundName(f.name.replace(/\.[^.]+$/, ''))
    try {
      const { columns: cols, data } = await parseXLSX(f)
      setColumns(cols)
      setParsedData(data)
      setPreview(data.slice(0, 5))
    } catch {
      setError('Could not parse the file. Make sure it is a valid .xlsx file.')
    }
  }

  async function handleUpload() {
    if (!file || !fundName.trim()) return
    setUploading(true)
    setError(null)
    try {
      await createFund(dashboardId, fundName.trim(), columns, parsedData, null)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError('Upload failed — please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Add New Fund</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#A67B50] hover:bg-[#F8F1EA] transition-all"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div>
                <div className="text-2xl mb-1">📊</div>
                <div className="font-medium text-slate-700">{file.name}</div>
                <div className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <div className="text-3xl mb-2">📂</div>
                <div className="text-slate-600 font-medium">Click to select an Excel file</div>
                <div className="text-slate-400 text-sm mt-1">.xlsx or .xls · max 10MB</div>
              </div>
            )}
          </div>

          {file && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fund name</label>
              <input
                type="text"
                value={fundName}
                onChange={(e) => setFundName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#A67B50]"
                placeholder="e.g. Retirement Fund"
              />
            </div>
          )}

          {preview && preview.length > 0 && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Preview (first 5 rows)</div>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      {columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        {columns.map((col) => (
                          <td key={col} className="px-3 py-2 whitespace-nowrap">{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading || !fundName.trim()}
            className="px-5 py-2 text-sm rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" style={{ backgroundColor: '#A67B50' }}
          >
            {uploading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {uploading ? 'Uploading…' : 'Upload Fund'}
          </button>
        </div>
      </div>
    </div>
  )
}
