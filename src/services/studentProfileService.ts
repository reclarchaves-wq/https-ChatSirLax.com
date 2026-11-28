import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ChatMessage, EducationCourseTrack, GradeLevel, LanguageMode, StudentProfile } from '../types';

export interface SaveStudentProfileInput {
  displayName: string;
  gradeLevel: GradeLevel;
  courseTrack: EducationCourseTrack;
  preferredLanguage: LanguageMode;
  schoolName?: string;
  learningGoal?: string;
}

export function subscribeStudentProfile(
  uid: string,
  onUpdate: (profile: StudentProfile | null) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${uid}`;
  const docRef = doc(db, 'users', uid);

  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      const data = snap.data();
      onUpdate({
        uid: String(data.uid || uid),
        displayName: String(data.displayName || ''),
        email: String(data.email || ''),
        gradeLevel: (data.gradeLevel as GradeLevel) || 'grade-1',
        courseTrack: (data.courseTrack as EducationCourseTrack) || 'all-subjects',
        preferredLanguage: (data.preferredLanguage as LanguageMode) || 'simple-english',
        schoolName: typeof data.schoolName === 'string' ? data.schoolName : '',
        learningGoal: typeof data.learningGoal === 'string' ? data.learningGoal : '',
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    }
  );
}

export async function saveStudentProfile(
  user: User,
  input: SaveStudentProfileInput
): Promise<void> {
  const path = `users/${user.uid}`;
  const docRef = doc(db, 'users', user.uid);

  const displayName = input.displayName.trim().slice(0, 60);
  if (!displayName) {
    throw new Error('Please enter your name or nickname so Sir Lax knows what to call you.');
  }

  const email = (user.email || '').trim().slice(0, 120);
  if (email.length < 3) {
    throw new Error('A verified Google account email is required to register.');
  }

  const schoolName = (input.schoolName || '').trim().slice(0, 100);
  const learningGoal = (input.learningGoal || '').trim().slice(0, 200);
  const courseTrack = (input.courseTrack || 'all-subjects').trim().slice(0, 50) as EducationCourseTrack;

  try {
    const existingSnap = await getDoc(docRef);

    if (!existingSnap.exists()) {
      const payload: Record<string, any> = {
        uid: user.uid,
        displayName,
        email,
        gradeLevel: input.gradeLevel,
        courseTrack,
        preferredLanguage: input.preferredLanguage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (schoolName) payload.schoolName = schoolName;
      if (learningGoal) payload.learningGoal = learningGoal;

      await setDoc(docRef, payload);
    } else {
      await updateDoc(docRef, {
        displayName,
        email,
        gradeLevel: input.gradeLevel,
        courseTrack,
        preferredLanguage: input.preferredLanguage,
        schoolName,
        learningGoal,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeStudentMessages(
  uid: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${uid}/messages`;
  const messagesRef = collection(db, 'users', uid, 'messages');
  const q = query(
    messagesRef,
    where('uid', '==', uid),
    orderBy('createdAt', 'asc'),
    limit(60)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const loaded: ChatMessage[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          sender: d.sender === 'user' ? 'user' : 'bot',
          text: String(d.text || ''),
          timestamp: String(d.timestampLabel || 'Saved'),
          isOffline: false,
          provider: d.provider === 'chatgpt' ? 'chatgpt' : 'gemini',
        };
      });
      onUpdate(loaded);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    }
  );
}

export async function saveStudentMessage(
  uid: string,
  msg: {
    sender: 'user' | 'bot';
    text: string;
    timestampLabel: string;
    provider?: 'gemini' | 'chatgpt';
  }
): Promise<void> {
  const path = `users/${uid}/messages`;
  const text = msg.text.trim().slice(0, 8000);
  if (!text) return;

  const payload: Record<string, any> = {
    uid,
    sender: msg.sender,
    text,
    timestampLabel: (msg.timestampLabel || 'Just now').slice(0, 32),
    createdAt: serverTimestamp(),
  };

  if (msg.sender === 'bot' && (msg.provider === 'gemini' || msg.provider === 'chatgpt')) {
    payload.provider = msg.provider;
  }

  try {
    await addDoc(collection(db, 'users', uid, 'messages'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function clearStudentMessages(uid: string): Promise<void> {
  const path = `users/${uid}/messages`;
  const messagesRef = collection(db, 'users', uid, 'messages');
  const q = query(messagesRef, where('uid', '==', uid));

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
