import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedEntityType = 'guide' | 'hotel' | 'destination';

export interface SavedCollectionItem {
  id: string;
  entityId: string;
  entityType: SavedEntityType;
  title: string;
  subtitle?: string;
  image?: string;
  savedAt: string;
}

export interface SavedCollection {
  id: string;
  title: string;
  createdAt: string;
  items: SavedCollectionItem[];
}

const COLLECTION_STORAGE_PREFIX = 'tourist_saved_collections';
export const DEFAULT_COLLECTION_ID = 'default_saved';
export const DEFAULT_COLLECTION_TITLE = 'Saved';

const getWebStorage = () =>
  typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;

const getCollectionsStorageKey = (userId: number | null) =>
  `${COLLECTION_STORAGE_PREFIX}_${userId ?? 'guest'}`;

const normalizeCollectionItem = (item: any): SavedCollectionItem | null => {
  if (!item) {
    return null;
  }

  const entityId = String(item.entityId ?? item.id ?? '').trim();
  const entityType = String(item.entityType ?? '').trim() as SavedEntityType;
  const title = String(item.title ?? item.name ?? '').trim();

  if (!entityId || !entityType || !title) {
    return null;
  }

  return {
    id: String(item.id ?? `${entityType}_${entityId}`),
    entityId,
    entityType,
    title,
    subtitle: item.subtitle ? String(item.subtitle) : undefined,
    image: item.image ? String(item.image) : undefined,
    savedAt: item.savedAt ? String(item.savedAt) : new Date().toISOString(),
  };
};

const normalizeCollection = (collection: any): SavedCollection | null => {
  if (!collection) {
    return null;
  }

  const id = String(collection.id ?? '').trim();
  const title = String(collection.title ?? '').trim();
  if (!id || !title) {
    return null;
  }

  const items = Array.isArray(collection.items)
    ? collection.items
        .map(normalizeCollectionItem)
        .filter((item): item is SavedCollectionItem => Boolean(item))
    : [];

  return {
    id,
    title,
    createdAt: collection.createdAt ? String(collection.createdAt) : new Date().toISOString(),
    items,
  };
};

export const ensureDefaultCollection = (collections: SavedCollection[]): SavedCollection[] => {
  const normalized = collections
    .map(normalizeCollection)
    .filter((collection): collection is SavedCollection => Boolean(collection));

  const existingDefault = normalized.find((collection) => collection.id === DEFAULT_COLLECTION_ID);
  const defaultCollection: SavedCollection =
    existingDefault ?? {
      id: DEFAULT_COLLECTION_ID,
      title: DEFAULT_COLLECTION_TITLE,
      createdAt: new Date().toISOString(),
      items: [],
    };

  const others = normalized.filter((collection) => collection.id !== DEFAULT_COLLECTION_ID);
  return [defaultCollection, ...others];
};

export const loadSavedCollections = async (userId: number | null): Promise<SavedCollection[]> => {
  const storageKey = getCollectionsStorageKey(userId);
  let rawValue: string | null = null;

  try {
    rawValue = await AsyncStorage.getItem(storageKey);
  } catch {
    rawValue = getWebStorage()?.getItem(storageKey) ?? null;
  }

  if (!rawValue) {
    const defaultCollections = ensureDefaultCollection([]);
    await persistSavedCollections(userId, defaultCollections);
    return defaultCollections;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const collections = ensureDefaultCollection(Array.isArray(parsed) ? parsed : []);
    await persistSavedCollections(userId, collections);
    return collections;
  } catch {
    const defaultCollections = ensureDefaultCollection([]);
    await persistSavedCollections(userId, defaultCollections);
    return defaultCollections;
  }
};

export const persistSavedCollections = async (
  userId: number | null,
  collections: SavedCollection[]
) => {
  const storageKey = getCollectionsStorageKey(userId);
  const normalized = ensureDefaultCollection(collections);
  const serialized = JSON.stringify(normalized);

  try {
    await AsyncStorage.setItem(storageKey, serialized);
  } catch {
    getWebStorage()?.setItem(storageKey, serialized);
  }
};

export const createSavedCollection = async (
  userId: number | null,
  title: string
): Promise<SavedCollection[]> => {
  const trimmedTitle = title.trim();
  const collections = await loadSavedCollections(userId);
  const normalizedTitle = trimmedTitle.toLowerCase();
  if (!trimmedTitle) {
    return collections;
  }

  const exists = collections.some((collection) => collection.title.trim().toLowerCase() === normalizedTitle);
  if (exists) {
    return collections;
  }

  const nextCollections = ensureDefaultCollection([
    ...collections,
    {
      id: `collection_${Date.now()}`,
      title: trimmedTitle,
      createdAt: new Date().toISOString(),
      items: [],
    },
  ]);

  await persistSavedCollections(userId, nextCollections);
  return nextCollections;
};

export const isItemSaved = (
  collections: SavedCollection[],
  entityType: SavedEntityType,
  entityId: string
) =>
  collections.some((collection) =>
    collection.items.some(
      (item) => item.entityType === entityType && item.entityId === String(entityId)
    )
  );

export const saveItemToCollections = async (
  userId: number | null,
  selectedCollectionId: string,
  item: SavedCollectionItem
): Promise<SavedCollection[]> => {
  const collections = await loadSavedCollections(userId);
  const targetIds = new Set([DEFAULT_COLLECTION_ID, selectedCollectionId || DEFAULT_COLLECTION_ID]);

  const nextCollections = collections.map((collection) => {
    if (!targetIds.has(collection.id)) {
      return collection;
    }

    const filteredItems = collection.items.filter(
      (existingItem) =>
        !(
          existingItem.entityType === item.entityType &&
          existingItem.entityId === item.entityId
        )
    );

    return {
      ...collection,
      items: [{ ...item, savedAt: new Date().toISOString() }, ...filteredItems],
    };
  });

  await persistSavedCollections(userId, nextCollections);
  return nextCollections;
};
