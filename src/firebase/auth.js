import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

const provider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider)
  const user = result.user

  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)

  if (!snap.exists()) {
    const dashboardRef = doc(db, 'dashboards', user.uid)
    await setDoc(dashboardRef, {
      owner: user.uid,
      collaborators: [],
      layout: [],
      createdAt: serverTimestamp(),
    })

    await setDoc(userRef, {
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      role: 'owner',
      dashboardId: user.uid,
      createdAt: serverTimestamp(),
    })
  }

  return user
}

export async function signOutUser() {
  return signOut(auth)
}
