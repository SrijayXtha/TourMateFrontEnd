import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    Auth,
    createUserWithEmailAndPassword,
    getAuth,
    signInAnonymously,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
} from 'firebase/auth';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasRealValue = (value?: string) => {
  const normalized = String(value || '').trim();
  return Boolean(normalized && normalized !== 'your_value');
};

const isFirebaseReady =
  hasRealValue(firebaseConfig.apiKey) &&
  hasRealValue(firebaseConfig.authDomain) &&
  hasRealValue(firebaseConfig.projectId) &&
  hasRealValue(firebaseConfig.appId);

export const IS_FIREBASE_ENABLED = isFirebaseReady;

const firebaseApp = isFirebaseReady
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

let firebaseAuth: Auth | null = null;
if (firebaseApp) {
  firebaseAuth = getAuth(firebaseApp);
}

export const firebaseDb = firebaseApp ? getFirestore(firebaseApp) : null;

export interface ChatPresenceRecord {
  appUserId: number;
  firebaseUid: string;
  fullName?: string;
  role?: string;
  email?: string;
}

export interface FirestoreMessage {
  id: string;
  senderId?: string;
  senderUserId?: number;
  receiverUserId?: number;
  text: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  editedAt?: string;
}

export const ensureFirebaseSession = async (): Promise<User | null> => {
  if (!firebaseAuth) {
    return null;
  }

  if (firebaseAuth.currentUser) {
    return firebaseAuth.currentUser;
  }

  try {
    const credential = await signInAnonymously(firebaseAuth);
    return credential.user;
  } catch (error) {
    console.warn('Failed to create Firebase anonymous session:', error);
    return null;
  }
};

export const clearFirebaseSession = async () => {
  if (!firebaseAuth) {
    return;
  }

  try {
    await signOut(firebaseAuth);
  } catch (error) {
    console.warn('Failed to clear Firebase session:', error);
  }
};

export const syncFirebaseAuthWithCredentials = async (params: {
  email?: string;
  password?: string;
  fullName?: string;
}): Promise<User | null> => {
  if (!firebaseAuth) {
    return null;
  }

  const email = String(params.email || '').trim().toLowerCase();
  const password = String(params.password || '').trim();

  if (!email || !password) {
    return ensureFirebaseSession();
  }

  try {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    if (params.fullName && credential.user.displayName !== params.fullName) {
      await updateProfile(credential.user, { displayName: params.fullName });
    }
    return credential.user;
  } catch (error: any) {
    if (error?.code === 'auth/user-not-found') {
      try {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (params.fullName) {
          await updateProfile(credential.user, { displayName: params.fullName });
        }
        return credential.user;
      } catch (createError) {
        console.warn('Failed to create Firebase credential user:', createError);
      }
    } else {
      console.warn('Firebase credential sign-in failed, falling back to anonymous:', error?.code || error);
    }

    return ensureFirebaseSession();
  }
};

const chatPresenceRef = (appUserId: number) =>
  firebaseDb ? doc(firebaseDb, 'chat_presence', String(appUserId)) : null;

export const registerChatPresence = async (params: {
  appUserId: number;
  fullName?: string;
  role?: string;
  email?: string;
}): Promise<ChatPresenceRecord | null> => {
  if (!firebaseDb || !Number.isInteger(params.appUserId) || params.appUserId <= 0) {
    return null;
  }

  const firebaseUser = await ensureFirebaseSession();
  if (!firebaseUser) {
    return null;
  }

  const ref = chatPresenceRef(params.appUserId);
  if (!ref) {
    return null;
  }

  const payload = {
    appUserId: params.appUserId,
    firebaseUid: firebaseUser.uid,
    fullName: params.fullName || '',
    role: params.role || '',
    email: params.email || '',
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload, { merge: true });
    return {
      appUserId: params.appUserId,
      firebaseUid: firebaseUser.uid,
      fullName: params.fullName || '',
      role: params.role || '',
      email: params.email || '',
    };
  } catch (error) {
    console.warn('Failed to register chat presence:', error);
    return null;
  }
};

export const getChatPresence = async (appUserId: number): Promise<ChatPresenceRecord | null> => {
  if (!firebaseDb || !Number.isInteger(appUserId) || appUserId <= 0) {
    return null;
  }

  const ref = chatPresenceRef(appUserId);
  if (!ref) {
    return null;
  }

  try {
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as Partial<ChatPresenceRecord>;
    const firebaseUid = String(data.firebaseUid || '').trim();

    if (!firebaseUid) {
      return null;
    }

    return {
      appUserId,
      firebaseUid,
      fullName: String(data.fullName || ''),
      role: String(data.role || ''),
      email: String(data.email || ''),
    };
  } catch (error) {
    console.warn('Failed to read chat presence:', error);
    return null;
  }
};

export const buildChatRoomId = (firstUserId: number, secondUserId: number): string => {
  const ordered = [Number(firstUserId), Number(secondUserId)].sort((a, b) => a - b);
  return `${ordered[0]}_${ordered[1]}`;
};

export const upsertChatRoom = async (params: {
  chatRoomId: string;
  participantFirebaseUids: string[];
  participantUserIds: number[];
  participantNames?: Record<string, string>;
  lastMessageText?: string;
}) => {
  if (!firebaseDb) {
    return;
  }

  const validFirebaseUids = params.participantFirebaseUids.filter((uid) => String(uid).trim());
  const validUserIds = params.participantUserIds
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (validFirebaseUids.length < 2 || validUserIds.length < 2) {
    return;
  }

  const roomRef = doc(firebaseDb, 'chats', params.chatRoomId);

  await setDoc(
    roomRef,
    {
      participants: validFirebaseUids,
      participantUserIds: validUserIds,
      participantNames: params.participantNames || {},
      updatedAt: serverTimestamp(),
      ...(params.lastMessageText
        ? {
            lastMessage: params.lastMessageText,
            lastMessageAt: serverTimestamp(),
          }
        : {}),
    },
    { merge: true }
  );
};

export const sendChatMessage = async (params: {
  chatRoomId: string;
  senderFirebaseUid: string;
  senderUserId: number;
  receiverUserId: number;
  text: string;
}): Promise<string | null> => {
  if (!firebaseDb) {
    return null;
  }

  const trimmedText = String(params.text || '').trim();
  if (!trimmedText) {
    return null;
  }

  const roomRef = doc(firebaseDb, 'chats', params.chatRoomId);
  const messageRef = await addDoc(collection(roomRef, 'messages'), {
    senderId: params.senderFirebaseUid,
    senderUserId: params.senderUserId,
    receiverUserId: params.receiverUserId,
    text: trimmedText,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(roomRef, {
    lastMessage: trimmedText,
    lastMessageAt: serverTimestamp(),
    lastSenderId: params.senderFirebaseUid,
    updatedAt: serverTimestamp(),
  });

  return messageRef.id;
};

export const editChatMessage = async (chatRoomId: string, messageId: string, text: string) => {
  if (!firebaseDb) {
    return;
  }

  const trimmedText = String(text || '').trim();
  if (!trimmedText) {
    return;
  }

  const messageRef = doc(firebaseDb, 'chats', chatRoomId, 'messages', messageId);
  await updateDoc(messageRef, {
    text: trimmedText,
    editedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(firebaseDb, 'chats', chatRoomId), {
    lastMessage: trimmedText,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const deleteChatMessage = async (chatRoomId: string, messageId: string) => {
  if (!firebaseDb) {
    return;
  }

  const messageRef = doc(firebaseDb, 'chats', chatRoomId, 'messages', messageId);
  await updateDoc(messageRef, {
    text: '',
    deleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

const asIsoString = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in (value as any)) {
    try {
      return (value as any).toDate().toISOString();
    } catch {
      return undefined;
    }
  }

  return undefined;
};

export const subscribeToChatMessages = (
  chatRoomId: string,
  onMessages: (messages: FirestoreMessage[]) => void,
  onError?: (error: unknown) => void
) => {
  if (!firebaseDb) {
    onMessages([]);
    return () => {};
  }

  const messageQuery = query(
    collection(firebaseDb, 'chats', chatRoomId, 'messages'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    messageQuery,
    (snapshot) => {
      const mapped: FirestoreMessage[] = snapshot.docs.map((entry) => {
        const data = entry.data() as Record<string, unknown>;

        return {
          id: entry.id,
          senderId: String(data.senderId || ''),
          senderUserId: Number(data.senderUserId || 0) || undefined,
          receiverUserId: Number(data.receiverUserId || 0) || undefined,
          text: String(data.text || ''),
          deleted: Boolean(data.deleted),
          createdAt: asIsoString(data.createdAt),
          updatedAt: asIsoString(data.updatedAt),
          editedAt: asIsoString(data.editedAt),
        };
      });

      onMessages(mapped);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};
