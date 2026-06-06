import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs, deleteDoc,
  query, where, arrayUnion, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

export async function createFund(dashboardId, name, columns, data, storageRef) {
  const ref = await addDoc(collection(db, 'funds'), {
    dashboardId,
    name,
    columns,
    data,
    storageRef,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteFund(fundId) {
  await deleteDoc(doc(db, 'funds', fundId))
}

export async function updateFundData(fundId, newData) {
  await updateDoc(doc(db, 'funds', fundId), {
    data: newData,
    updatedAt: serverTimestamp(),
  })
}

export async function getDashboard(dashboardId) {
  const snap = await getDoc(doc(db, 'dashboards', dashboardId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateLayout(dashboardId, layout) {
  await updateDoc(doc(db, 'dashboards', dashboardId), { layout })
}

export async function inviteCollaborator(dashboardId, email) {
  await addDoc(collection(db, 'invites'), {
    dashboardId,
    email: email.toLowerCase(),
    createdAt: serverTimestamp(),
  })
}

export async function checkAndAcceptInvite(userEmail, userId, dashboardId) {
  const q = query(
    collection(db, 'invites'),
    where('email', '==', userEmail.toLowerCase())
  )
  const snap = await getDocs(q)
  if (snap.empty) return null

  const invite = snap.docs[0]
  const targetDashboardId = invite.data().dashboardId

  await updateDoc(doc(db, 'dashboards', targetDashboardId), {
    collaborators: arrayUnion(userId),
  })

  return targetDashboardId
}

export async function logTransaction(fundId, dashboardId, contributorId, contributorName, amount, month, note) {
  await addDoc(collection(db, 'transactions'), {
    fundId,
    dashboardId,
    contributorId,
    contributorName,
    amount,
    month,
    note,
    createdAt: serverTimestamp(),
  })
}

export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getDashboardCollaborators(dashboardId) {
  const dashboard = await getDashboard(dashboardId)
  if (!dashboard) return []

  const ids = [dashboard.owner, ...(dashboard.collaborators || [])]
  const users = await Promise.all(
    ids.map(async (uid) => {
      const snap = await getDoc(doc(db, 'users', uid))
      return snap.exists() ? { id: snap.id, ...snap.data() } : null
    })
  )
  return users.filter(Boolean)
}

export async function removeDashboardCollaborator(dashboardId, userId) {
  const dashRef = doc(db, 'dashboards', dashboardId)
  const snap = await getDoc(dashRef)
  if (!snap.exists()) return
  const current = snap.data().collaborators || []
  await updateDoc(dashRef, {
    collaborators: current.filter((id) => id !== userId),
  })
}

export async function getPendingInvites(dashboardId) {
  const q = query(collection(db, 'invites'), where('dashboardId', '==', dashboardId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
