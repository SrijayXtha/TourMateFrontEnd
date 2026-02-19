import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { mockGuides } from '../../data/mockData';

interface ExploreGuidesTabProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function ExploreGuidesTab({ onNavigate }: ExploreGuidesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Guides');

  const filters = ['All Guides', 'Mountain', 'Cultural', 'Adventure'];

  const filteredGuides = mockGuides.filter((guide) => {
    const matchesSearch = guide.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All Guides' || 
                         guide.specialties.some(s => s.toLowerCase().includes(selectedFilter.toLowerCase()));
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      {/* Search & Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guides..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Guides List */}
      <ScrollView
        style={styles.guidesList}
        contentContainerStyle={styles.guidesContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredGuides.length > 0 ? (
          filteredGuides.map((guide) => (
            <View key={guide.id} style={styles.guideCard}>
              <View style={styles.guideCardContent}>
                <Image
                  source={typeof guide.photo === 'string' ? { uri: guide.photo } : guide.photo}
                  style={styles.guidePhoto}
                  resizeMode="cover"
                />
                <View style={styles.guideInfo}>
                  <View style={styles.guideHeader}>
                    <View style={styles.guideNameContainer}>
                      <Text style={styles.guideName}>{guide.name}</Text>
                      {guide.verified && (
                        <View style={styles.verifiedBadge}>
                          <MaterialCommunityIcons name="check-circle" size={14} color="#2BC7B2" />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.guideStats}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                      <Text style={styles.statText}>{guide.rating}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="briefcase" size={16} color="#6B7280" />
                      <Text style={styles.statText}>{guide.experience}</Text>
                    </View>
                  </View>

                  <View style={styles.specialtiesContainer}>
                    {guide.specialties.slice(0, 2).map((specialty) => (
                      <View key={specialty} style={styles.specialtyBadge}>
                        <Text style={styles.specialtyText}>{specialty}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.guideFooter}>
                    <View style={styles.priceContainer}>
                      <MaterialCommunityIcons name="currency-usd" size={16} color="#1B73E8" />
                      <Text style={styles.priceText}>{guide.pricePerDay}/day</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewProfileButton}
                      onPress={() => onNavigate('guide-profile', guide)}
                    >
                      <Text style={styles.viewProfileButtonText}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialCommunityIcons name="account-search-outline" size={64} color="#9CA3AF" />
            <Text style={styles.noResultsText}>
              No guides found. Try adjusting your filters.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  filtersScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filtersContent: {
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1B73E8',
    borderColor: '#1B73E8',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  guidesList: {
    flex: 1,
  },
  guidesContent: {
    padding: 16,
    gap: 16,
  },
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  guideCardContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  guidePhoto: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideHeader: {
    marginBottom: 8,
  },
  guideNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  guideName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#2BC7B2',
    fontWeight: '600',
  },
  guideStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specialtyBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specialtyText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  guideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceText: {
    fontSize: 14,
    color: '#1B73E8',
    fontWeight: '600',
  },
  viewProfileButton: {
    backgroundColor: '#1B73E8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
});
