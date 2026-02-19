import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ExploreDestinationsTab } from './ExploreDestinationsTab';
import { ExploreHotelsTab } from './ExploreHotelsTab';

interface ExploreProps {
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function Explore({ onNavigate, onBack }: ExploreProps) {
  const [activeTab, setActiveTab] = useState<'destinations' | 'hotels'>('destinations');

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1B73E8', '#2BC7B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>
          Discover amazing destinations and hotels
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'destinations' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('destinations')}
        >
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={activeTab === 'destinations' ? '#1B73E8' : '#6B7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'destinations' && styles.activeTabText,
            ]}
          >
            Destinations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'hotels' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('hotels')}
        >
          <MaterialCommunityIcons
            name="office-building"
            size={20}
            color={activeTab === 'hotels' ? '#1B73E8' : '#6B7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'hotels' && styles.activeTabText,
            ]}
          >
            Hotels
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'destinations' ? (
        <ExploreDestinationsTab onNavigate={onNavigate} />
      ) : (
        <ExploreHotelsTab onNavigate={onNavigate} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1B73E8',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1B73E8',
  },
});
