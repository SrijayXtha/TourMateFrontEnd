import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { publicAPI } from '../../constants/api';

interface ExploreHotelsTabProps {
  onNavigate: (screen: string, data?: any) => void;
}

interface HotelCard {
  id: string;
  name: string;
  image: string;
  rating: number;
  location: string;
  pricePerNight: string;
  amenities: string[];
  verified: boolean;
  description?: string;
  roomTypes?: string[];
}

const HOTEL_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80',
];

const filters = ['All Hotels', 'Luxury', 'Budget', 'Boutique'];

const toHotelCard = (hotel: any, index: number): HotelCard => ({
  id: String(hotel.hotelId ?? hotel.id ?? index + 1),
  name: String(hotel.name || 'Featured Stay'),
  image: hotel.image || HOTEL_FALLBACK_IMAGES[index % HOTEL_FALLBACK_IMAGES.length],
  rating: Number.parseFloat(String(hotel.avgRating ?? hotel.rating ?? '4.6')) || 4.6,
  location: String(hotel.location || 'Nepal'),
  pricePerNight: `NPR ${4500 + index * 700}/night`,
  amenities: ['WiFi', 'Breakfast', 'Great Location'],
  verified: true,
  description: hotel.description || 'Comfortable stay with easy access to nearby attractions.',
  roomTypes: ['Standard Room', 'Deluxe Room'],
});

export function ExploreHotelsTab({ onNavigate }: ExploreHotelsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Hotels');
  const [hotels, setHotels] = useState<HotelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        setErrorText('');
        const response = await publicAPI.getHotels(1, 20);
        const items = ((response?.data?.hotels || []) as any[]).map(toHotelCard);
        setHotels(items);
      } catch (error: any) {
        setHotels([]);
        setErrorText(error?.message || 'Unable to load hotels right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadHotels();
  }, []);

  const filteredHotels = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return hotels.filter((hotel) => {
      const matchesFilter =
        selectedFilter === 'All Hotels' ||
        (selectedFilter === 'Luxury' && hotel.rating >= 4.8) ||
        (selectedFilter === 'Budget' && hotel.pricePerNight.includes('4500')) ||
        (selectedFilter === 'Boutique' &&
          `${hotel.description} ${hotel.name}`.toLowerCase().includes('boutique'));

      const matchesQuery =
        !normalizedQuery ||
        `${hotel.name} ${hotel.location} ${hotel.description} ${hotel.amenities.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [hotels, searchQuery, selectedFilter]);

  return (
    <View style={styles.container}>
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

      <ScrollView
        style={styles.hotelsList}
        contentContainerStyle={styles.hotelsContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.noResultsContainer}>
            <ActivityIndicator size="small" color="#1B73E8" />
            <Text style={styles.noResultsText}>Loading hotels...</Text>
          </View>
        ) : filteredHotels.length > 0 ? (
          filteredHotels.map((hotel) => (
            <TouchableOpacity
              key={hotel.id}
              style={styles.hotelCard}
              activeOpacity={0.9}
              onPress={() => onNavigate('hotel-details', hotel)}
            >
              <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
              <View style={styles.hotelInfo}>
                <View style={styles.hotelHeader}>
                  <View style={styles.hotelTitleContainer}>
                    <Text style={styles.hotelName}>{hotel.name}</Text>
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
                      <Text style={styles.locationText}>{hotel.location}</Text>
                    </View>
                  </View>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
                  </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                  {hotel.description}
                </Text>

                <View style={styles.amenitiesContainer}>
                  {hotel.amenities.slice(0, 3).map((amenity) => (
                    <View key={amenity} style={styles.amenityBadge}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.footer}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceValue}>{hotel.pricePerNight}</Text>
                  </View>
                  <View style={styles.detailsButton}>
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialCommunityIcons name="office-building" size={64} color="#D1D5DB" />
            <Text style={styles.noResultsText}>
              {errorText || 'No hotels matched your current search.'}
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
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hotelImage: {
    width: '100%',
    height: 192,
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
    color: '#1F2937',
    fontWeight: '600',
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 12,
    color: '#6B7280',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B73E8',
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
