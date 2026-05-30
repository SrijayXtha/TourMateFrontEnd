import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DEFAULT_COLLECTION_ID, SavedCollection } from './savedCollections';

interface SaveToCollectionModalProps {
  visible: boolean;
  collections: SavedCollection[];
  saving?: boolean;
  onClose: () => void;
  onSelect: (collectionId: string) => void;
}

export function SaveToCollectionModal({
  visible,
  collections,
  saving = false,
  onClose,
  onSelect,
}: SaveToCollectionModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Save To Collection</Text>
              <Text style={styles.subtitle}>
                Every save also goes into your default Saved folder.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={saving}>
              <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {collections.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={styles.collectionButton}
                onPress={() => onSelect(collection.id)}
                disabled={saving}
              >
                <View style={styles.collectionIconWrap}>
                  <MaterialCommunityIcons
                    name={collection.id === DEFAULT_COLLECTION_ID ? 'bookmark' : 'folder'}
                    size={20}
                    color="#1B73E8"
                  />
                </View>
                <View style={styles.collectionTextWrap}>
                  <Text style={styles.collectionTitle}>{collection.title}</Text>
                  <Text style={styles.collectionMeta}>
                    {collection.items.length} saved item{collection.items.length === 1 ? '' : 's'}
                  </Text>
                </View>
                {saving ? (
                  <ActivityIndicator size="small" color="#1B73E8" />
                ) : (
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  list: {
    gap: 10,
  },
  collectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  collectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  collectionTextWrap: {
    flex: 1,
  },
  collectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  collectionMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
});
