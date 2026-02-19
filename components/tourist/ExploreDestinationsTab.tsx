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
import { mockDestinations } from '../../data/mockData';

interface ExploreDestinationsTabProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function ExploreDestinationsTab({ onNavigate }: ExploreDestinationsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Mountain', 'Beach', 'Cultural', 'Adventure', 'Historical'];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'Moderate':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'Challenging':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const filteredDestinations = mockDestinations.filter((dest) => {
    const matchesSearch = dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dest.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || 
                         dest.category.toLowerCase().includes(selectedFilter.toLowerCase()) ||
                         dest.activities.some(a => a.toLowerCase().includes(selectedFilter.toLowerCase()));
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
            placeholder="Search destinations..."
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

      {/* Destinations List */}
      <ScrollView
        style={styles.destinationsList}
        contentContainerStyle={styles.destinationsContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredDestinations.length > 0 ? (
          filteredDestinations.map((destination) => {
            const difficultyColors = getDifficultyColor(destination.difficulty);
            return (
              <View key={destination.id} style={styles.destinationCard}>
                {/* Image Section */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: destination.image }}
                    style={styles.destinationImage}
                    resizeMode="cover"
                  />
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: difficultyColors.bg },
                    ]}
                  >
                    <Text style={[styles.difficultyText, { color: difficultyColors.text }]}>
                      {destination.difficulty}
                    </Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{destination.category}</Text>
                  </View>
                </View>

                {/* Content Section */}
                <View style={styles.cardContent}>
                  {/* Title & Rating */}
                  <View style={styles.titleRow}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.destinationName}>{destination.name}</Text>
                      <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
                        <Text style={styles.locationText}>{destination.location}</Text>
                      </View>
                    </View>
                    <View style={styles.ratingContainer}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                      <Text style={styles.ratingText}>{destination.rating}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.description} numberOfLines={2}>
                    {destination.description}
                  </Text>

                  {/* Details Row */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{destination.duration}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="trending-up" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{destination.bestTime}</Text>
                    </View>
                  </View>

                  {/* Activities */}
                  <View style={styles.activitiesRow}>
                    {destination.activities.slice(0, 3).map((activity) => (
                      <View key={activity} style={styles.activityTag}>
                        <Text style={styles.activityTagText}>{activity}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer with Price & Button */}
                  <View style={styles.cardFooter}>
                    <View style={styles.priceContainer}>
                      <MaterialCommunityIcons name="currency-usd" size={20} color="#1B73E8" />
                      <Text style={styles.priceValue}>{destination.price}</Text>
                      <Text style={styles.priceLabel}>/package</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() => onNavigate('destination-details', destination)}
                    >
                      <Text style={styles.viewDetailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialCommunityIcons name="map-search-outline" size={64} color="#9CA3AF" />
            <Text style={styles.noResultsText}>
              No destinations found. Try adjusting your filters.
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
  destinationsList: {
    flex: 1,
  },
  destinationsContent: {
    padding: 16,
    gap: 16,
  },
  destinationCard: {
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 192,
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  activitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  activityTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityTagText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B73E8',
  },
  priceLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  viewDetailsButton: {
    backgroundColor: '#1B73E8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewDetailsButtonText: {
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
