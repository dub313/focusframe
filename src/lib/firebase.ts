import { initializeApp } from 'firebase/app';
import {
  getFirestore,
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

const firebaseConfig = {
  apiKey: "AIzaSyBEZB5KIafwG9FvB6Ng22xwXi5bCo7FWco",
  authDomain: "focusframe-f6214.firebaseapp.com",
  projectId: "focusframe-f6214",
  storageBucket: "focusframe-f6214.firebasestorage.app",
  messagingSenderId: "115837504004",
  appId: "1:115837504004:web:c6e73d40d411e60bd90351",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Family Code System ===
// Parent and child connect via a shared code like "MASON-2026"
// All shared data lives under families/{familyCode}/

function familyPath(familyCode: string) {
  return `families/${familyCode.toUpperCase().trim()}`;
}

// === Parent → Child: Assigned Tasks ===

export interface ParentTask {
  id: string;
  name: string;
  type: 'quick_win' | 'standard' | 'multi_level';
  assignedAt: string;
  completed: boolean;
  completedAt?: string;
  steps?: string[]; // for multi_level
}

export async function pushParentTask(familyCode: string, task: ParentTask): Promise<void> {
  const path = `${familyPath(familyCode)}/tasks/${task.id}`;
  await setDoc(doc(db, path), task);
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

export interface ChildProgress {
  lastUpdated: string;
  totalXP: number;
  currentStreak: number;
  daysActive: number;
  totalTasksCompleted: number;
  todayTasksDone: number;
  todayTasksTotal: number;
  todayEnergy: number;
  todayTraining: string;
  todayXP: number;
  surgeActive: boolean;
  vaultBalance: number;
  // NO mood, NO notes, NO chat history, NO breathing data
}

export async function pushChildProgress(familyCode: string, progress: ChildProgress): Promise<void> {
  await setDoc(doc(db, `${familyPath(familyCode)}/progress/current`), progress);
}

export function onChildProgress(familyCode: string, callback: (progress: ChildProgress | null) => void): Unsubscribe {
  return onSnapshot(doc(db, `${familyPath(familyCode)}/progress/current`), (snap) => {
    callback(snap.exists() ? (snap.data() as ChildProgress) : null);
  });
}

// === Rewards ===

export interface SharedReward {
  id: string;
  name: string;
  description: string;
  tier: string;
  xpCost: number;
  active: boolean;
}

export async function pushRewards(familyCode: string, rewards: SharedReward[]): Promise<void> {
  await setDoc(doc(db, `${familyPath(familyCode)}/config/rewards`), { items: rewards });
}

export async function getRewards(familyCode: string): Promise<SharedReward[]> {
  const snap = await getDoc(doc(db, `${familyPath(familyCode)}/config/rewards`));
  if (!snap.exists()) return [];
  return (snap.data() as { items: SharedReward[] }).items ?? [];
}

export function onRewards(familyCode: string, callback: (rewards: SharedReward[]) => void): Unsubscribe {
  return onSnapshot(doc(db, `${familyPath(familyCode)}/config/rewards`), (snap) => {
    if (snap.exists()) {
      callback((snap.data() as { items: SharedReward[] }).items ?? []);
    } else {
      callback([]);
    }
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
