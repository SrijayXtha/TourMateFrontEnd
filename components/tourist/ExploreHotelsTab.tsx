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
import { mockHotels } from '../../data/mockData';

interface ExploreHotelsTabProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function ExploreHotelsTab({ onNavigate }: ExploreHotelsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Hotels');

  const filters = ['All Hotels', 'Luxury', 'Budget', 'Boutique'];

  const filteredHotels = mockHotels.filter((hotel) => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hotel.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All Hotels' || 
                         hotel.name.toLowerCase().includes(selectedFilter.toLowerCase());
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
            placeholder="Search hotels..."
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

      {/* Hotels List */}
      <ScrollView
        style={styles.hotelsList}
        contentContainerStyle={styles.hotelsContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredHotels.length > 0 ? (
          filteredHotels.map((hotel) => (
            <View key={hotel.id} style={styles.hotelCard}>
              {/* Image Section */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: hotel.image }}
                  style={styles.hotelImage}
                  resizeMode="cover"
                />
                {hotel.verified && (
                  <View style={styles.verifiedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={14} color="#fff" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>

              {/* Info Section */}
              <View style={styles.hotelInfo}>
                {/* Header */}
                <View style={styles.hotelHeader}>
                  <View style={styles.hotelTitleContainer}>
                    <Text style={styles.hotelName} numberOfLines={1}>
                      {hotel.name}
                    </Text>
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {hotel.location}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                    <Text style={styles.ratingText}>{hotel.rating}</Text>
                  </View>
                </View>

                {/* Description */}
                {hotel.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {hotel.description}
                  </Text>
                )}

                {/* Amenities */}
                <View style={styles.amenitiesContainer}>
                  {hotel.amenities.slice(0, 4).map((amenity, index) => (
                    <View key={index} style={styles.amenityBadge}>
                      {amenity === 'Free WiFi' && (
                        <MaterialCommunityIcons name="wifi" size={12} color="#6B7280" />
                      )}
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                  {hotel.amenities.length > 4 && (
                    <View style={styles.amenityBadge}>
                      <Text style={styles.amenityText}>
                        +{hotel.amenities.length - 4} more
                      </Text>
                    </View>
                  )}
                </View>

                {/* Room Types */}
                {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                  <Text style={styles.roomTypesText}>
                    <Text style={styles.roomTypesCount}>{hotel.roomTypes.length}</Text> room types available
                  </Text>
                )}

                {/* Price and Action */}
                <View style={styles.footer}>
                  <View style={styles.priceContainer}>
                    <View style={styles.priceRow}>
                      <MaterialCommunityIcons name="cash" size={20} color="#1B73E8" />
                      <Text style={styles.priceValue}>{hotel.pricePerNight}</Text>
                    </View>
                    <Text style={styles.priceLabel}>per night</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => onNavigate('hotel-details', hotel)}
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialCommunityIcons name="office-building" size={64} color="#D1D5DB" />
            <Text style={styles.noResultsText}>No hotels found. Try adjusting your filters.</Text>
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
    paddingHorizontal: 24,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  filtersScroll: {
    marginTop: 12,
  },
  filtersContent: {
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#1B73E8',
    borderColor: '#1B73E8',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  hotelsList: {
    flex: 1,
  },
  hotelsContent: {
    padding: 24,
    gap: 16,
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  hotelImage: {
    width: '100%',
    height: 192,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2BC7B2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  hotelInfo: {
    padding: 16,
  },
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  amenityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  roomTypesText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  roomTypesCount: {
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceContainer: {
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B73E8',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailsButton: {
    backgroundColor: '#1B73E8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  noResultsText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
});
