import { ref, uploadBytes, getDownloadURL, getBytes } from 'firebase/storage'
import { storage } from './config'

export async function uploadXLSX(dashboardId, fundName, fileBuffer) {
  const path = `funds/${dashboardId}/${fundName}.xlsx`
  const storageRef = ref(storage, path)
  const uint8 = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer)
  await uploadBytes(storageRef, uint8, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return path
}

export async function downloadXLSX(storagePath) {
  const storageRef = ref(storage, storagePath)
  const bytes = await getBytes(storageRef)
  return bytes
}

export async function getXLSXDownloadURL(storagePath) {
  const storageRef = ref(storage, storagePath)
  return getDownloadURL(storageRef)
}
