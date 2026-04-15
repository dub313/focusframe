import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type {
  ParentTask,
  ChildProgress,
  SharedReward,
  Redemption,
  RewardRequest,
} from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBEZB5KIafwG9FvB6Ng22xwXi5bCo7FWco",
  authDomain: "focusframe-f6214.firebaseapp.com",
  projectId: "focusframe-f6214",
  storageBucket: "focusframe-f6214.firebasestorage.app",
  messagingSenderId: "115837504004",
  appId: "1:115837504004:web:c6e73d40d411e60bd90351",
};

const app = initializeApp(firebaseConfig);
// ignoreUndefinedProperties so optional fields (urgent, completionMessage,
// steps, description) can safely be `undefined` in writes without Firestore
// throwing. Undefined fields are dropped from the document.
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

// Re-export for backwards compat with any old imports
export type { ParentTask, ChildProgress, SharedReward, Redemption, RewardRequest };

// === Family Code System ===
// Parent and child connect via a shared code like "MASON-2026"
// All shared data lives under families/{familyCode}/

function familyPath(familyCode: string) {
  return `families/${familyCode.toUpperCase().trim()}`;
}

// === Parent → Child: Assigned Tasks ===

export async function pushParentTask(familyCode: string, task: ParentTask): Promise<void> {
  const path = `${familyPath(familyCode)}/tasks/${task.id}`;
  await setDoc(doc(db, path), task);
}

export async function updateParentTask(
  familyCode: string,
  taskId: string,
  patch: Partial<ParentTask>,
): Promise<void> {
  const path = `${familyPath(familyCode)}/tasks/${taskId}`;
  await setDoc(doc(db, path), patch, { merge: true });
}

export async function removeParentTask(familyCode: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, `${familyPath(familyCode)}/tasks/${taskId}`));
}

export async function getParentTasks(familyCode: string): Promise<ParentTask[]> {
  const ref = collection(db, `${familyPath(familyCode)}/tasks`);
  const q = query(ref, orderBy('assignedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ParentTask);
}

export function onParentTasks(familyCode: string, callback: (tasks: ParentTask[]) => void): Unsubscribe {
  const ref = collection(db, `${familyPath(familyCode)}/tasks`);
  const q = query(ref, orderBy('assignedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as ParentTask));
  });
}

export async function markParentTaskComplete(familyCode: string, taskId: string): Promise<void> {
  const path = `${familyPath(familyCode)}/tasks/${taskId}`;
  await setDoc(doc(db, path), { completed: true, completedAt: new Date().toISOString() }, { merge: true });
}

// === Child → Parent: Visible Progress (NO private data) ===

export async function pushChildProgress(familyCode: string, progress: ChildProgress): Promise<void> {
  await setDoc(doc(db, `${familyPath(familyCode)}/progress/current`), progress);
}

export function onChildProgress(familyCode: string, callback: (progress: ChildProgress | null) => void): Unsubscribe {
  return onSnapshot(doc(db, `${familyPath(familyCode)}/progress/current`), (snap) => {
    callback(snap.exists() ? (snap.data() as ChildProgress) : null);
  });
}

// === Rewards Catalog (collection, not blob) ===

export async function pushReward(familyCode: string, reward: SharedReward): Promise<void> {
  await setDoc(doc(db, `${familyPath(familyCode)}/rewards/${reward.id}`), reward);
}

export async function updateReward(
  familyCode: string,
  rewardId: string,
  patch: Partial<SharedReward>,
): Promise<void> {
  await setDoc(doc(db, `${familyPath(familyCode)}/rewards/${rewardId}`), patch, { merge: true });
}

export async function removeReward(familyCode: string, rewardId: string): Promise<void> {
  await deleteDoc(doc(db, `${familyPath(familyCode)}/rewards/${rewardId}`));
}

export async function getRewards(familyCode: string): Promise<SharedReward[]> {
  const ref = collection(db, `${familyPath(familyCode)}/rewards`);
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data() as SharedReward);
}

export function onRewards(familyCode: string, callback: (rewards: SharedReward[]) => void): Unsubscribe {
  const ref = collection(db, `${familyPath(familyCode)}/rewards`);
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => d.data() as SharedReward));
  });
}

// === Redemption Queue (child → parent approval) ===

export async function pushRedemption(familyCode: string, redemption: Redemption): Promise<void> {
  await setDoc(doc(db, `${familyPath(familyCode)}/redemptions/${redemption.id}`), redemption);
}

export async function approveRedemption(familyCode: string, redemptionId: string): Promise<void> {
  await setDoc(
    doc(db, `${familyPath(familyCode)}/redemptions/${redemptionId}`),
    { status: 'approved', approvedAt: new Date().toISOString() },
    { merge: true },
  );
}

export async function denyRedemption(
  familyCode: string,
  redemptionId: string,
  reason: string,
): Promise<void> {
  await setDoc(
    doc(db, `${familyPath(familyCode)}/redemptions/${redemptionId}`),
    { status: 'denied', deniedAt: new Date().toISOString(), denyReason: reason },
    { merge: true },
  );
}

export function onRedemptions(
  familyCode: string,
  callback: (redemptions: Redemption[]) => void,
): Unsubscribe {
  const ref = collection(db, `${familyPath(familyCode)}/redemptions`);
  const q = query(ref, orderBy('requestedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Redemption));
  });
}

// === Custom Reward Requests (child proposals → parent accept/decline) ===

export async function pushRewardRequest(familyCode: string, request: RewardRequest): Promise<void> {
  await setDoc(doc(db, `${familyPath(familyCode)}/rewardRequests/${request.id}`), request);
}

export async function acceptRewardRequest(
  familyCode: string,
  requestId: string,
  xpCost: number,
  category: RewardRequest['acceptedCategory'],
): Promise<void> {
  await setDoc(
    doc(db, `${familyPath(familyCode)}/rewardRequests/${requestId}`),
    {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      acceptedXpCost: xpCost,
      acceptedCategory: category,
    },
    { merge: true },
  );
}

export async function declineRewardRequest(
  familyCode: string,
  requestId: string,
  reason: string,
): Promise<void> {
  await setDoc(
    doc(db, `${familyPath(familyCode)}/rewardRequests/${requestId}`),
    { status: 'declined', declinedAt: new Date().toISOString(), declineReason: reason },
    { merge: true },
  );
}

export function onRewardRequests(
  familyCode: string,
  callback: (requests: RewardRequest[]) => void,
): Unsubscribe {
  const ref = collection(db, `${familyPath(familyCode)}/rewardRequests`);
  const q = query(ref, orderBy('requestedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as RewardRequest));
  });
}

// === Family Code Setup ===

export async function createFamily(familyCode: string, parentName: string): Promise<void> {
  await setDoc(doc(db, `${familyPath(familyCode)}/config/family`), {
    createdAt: new Date().toISOString(),
    parentName,
    familyCode: familyCode.toUpperCase().trim(),
  });
}

export async function familyExists(familyCode: string): Promise<boolean> {
  const snap = await getDoc(doc(db, `${familyPath(familyCode)}/config/family`));
  return snap.exists();
}
