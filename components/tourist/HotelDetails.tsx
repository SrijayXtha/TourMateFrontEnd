import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Hotel {
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

interface HotelDetailsProps {
  hotel: Hotel;
  onBack: () => void;
  onBook?: (startDate: string, endDate: string) => Promise<void> | void;
  onNavigate?: (screen: string, data?: any) => void;
}

export function HotelDetails({ hotel, onBack, onBook }: HotelDetailsProps) {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate available dates for the next 30 days
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleBookRoom = () => {
    if (!checkInDate || !checkOutDate) {
      Alert.alert('Select Dates', 'Please select check-in and check-out dates to continue booking.');
      return;
    }
    
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      Alert.alert('Invalid Dates', 'Check-out date must be after check-in date.');
      return;
    }

    Alert.alert(
      'Book Room',
      `Book a room at ${hotel.name}?\nCheck-in: ${formatDate(checkInDate)}\nCheck-out: ${formatDate(checkOutDate)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => {
            if (!onBook) {
              Alert.alert('Success', 'Booking request submitted!');
              return;
            }

            setIsSubmitting(true);
            Promise.resolve(onBook(checkInDate, checkOutDate))
              .catch((error: any) => {
                Alert.alert(
                  'Booking Failed',
                  error?.message || 'Unable to create booking request. Please try again.'
                );
              })
              .finally(() => {
                setIsSubmitting(false);
              });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: hotel.image }}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        {hotel.verified && (
          <View style={styles.verifiedBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentPadding}>
          {/* Title & Rating */}
          <View style={styles.section}>
            <View style={styles.titleRow}>
              <Text style={styles.hotelName}>{hotel.name}</Text>
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
                <Text style={styles.ratingText}>{hotel.rating}</Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#6B7280" />
              <Text style={styles.locationText}>{hotel.location}</Text>
            </View>
          </View>

          {/* Description */}
          {hotel.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{hotel.description}</Text>
            </View>
          )}

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {hotel.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityCard}>
                  <MaterialCommunityIcons
                    name={
                      amenity.toLowerCase().includes('wifi')
                        ? 'wifi'
                        : amenity.toLowerCase().includes('pool')
                        ? 'pool'
                        : amenity.toLowerCase().includes('restaurant')
                        ? 'silverware-fork-knife'
                        : amenity.toLowerCase().includes('spa')
                        ? 'spa'
                        : amenity.toLowerCase().includes('gym')
                        ? 'dumbbell'
                        : amenity.toLowerCase().includes('parking')
                        ? 'parking'
                        : 'check-circle'
                    }
                    size={24}
                    color="#1B73E8"
                  />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Room Types */}
          {hotel.roomTypes && hotel.roomTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Room Types</Text>
              {hotel.roomTypes.map((roomType, index) => (
                <View key={index} style={styles.roomTypeCard}>
                  <MaterialCommunityIcons name="bed" size={20} color="#1B73E8" />
                  <Text style={styles.roomTypeText}>{roomType}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Price Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <MaterialCommunityIcons name="cash" size={24} color="#1B73E8" />
                <Text style={styles.priceValue}>{hotel.pricePerNight}</Text>
              </View>
              <Text style={styles.priceLabel}>per night</Text>
            </View>
          </View>

          {/* Booking Dates */}
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <MaterialCommunityIcons name="calendar-blank" size={20} color="#1B73E8" />
              <Text style={styles.bookingTitle}>Select Booking Dates</Text>
            </View>

            <View style={styles.dateInputSection}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  const buttons = [
                    ...availableDates.slice(0, 10).map((date) => ({
                      text: formatDate(date),
                      onPress: () => setCheckInDate(date),
                    })),
                    { text: 'Cancel', style: 'cancel' as const },
                  ];
                  Alert.alert('Select Check-in Date', 'Choose your check-in date', buttons);
                }}
              >
                <Text style={checkInDate ? styles.dateInputText : styles.dateInputPlaceholder}>
                  {checkInDate ? new Date(checkInDate).toLocaleDateString('en-US') : 'mm/dd/yyyy'}
                </Text>
                <MaterialCommunityIcons name="calendar" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputSection}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  const buttons = [
                    ...availableDates.slice(0, 10).map((date) => ({
                      text: formatDate(date),
                      onPress: () => setCheckOutDate(date),
                    })),
                    { text: 'Cancel', style: 'cancel' as const },
                  ];
                  Alert.alert('Select Check-out Date', 'Choose your check-out date', buttons);
                }}
              >
                <Text style={checkOutDate ? styles.dateInputText : styles.dateInputPlaceholder}>
                  {checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-US') : 'mm/dd/yyyy'}
                </Text>
                <MaterialCommunityIcons name="calendar" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.availableDatesInfo}>
              <MaterialCommunityIcons name="calendar-check" size={16} color="#1B73E8" />
              <Text style={styles.availableDatesText}>
                Available dates: {availableDates.slice(0, 3).map(formatDate).join(', ')}, and more
              </Text>
            </View>
          </View>

          {/* Location Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapPlaceholder}>
              <MaterialCommunityIcons name="map" size={48} color="#9CA3AF" />
              <Text style={styles.mapText}>{hotel.location}</Text>
            </View>
          </View>

          {/* Spacer for button */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceValue}>{hotel.pricePerNight}</Text>
          <Text style={styles.footerPriceLabel}>/night</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!checkInDate || !checkOutDate || isSubmitting) && styles.bookButtonDisabled,
          ]}
          onPress={handleBookRoom}
          disabled={!checkInDate || !checkOutDate || isSubmitting}
        >
          <Text style={styles.bookButtonText}>
            {isSubmitting ? 'Submitting...' : 'Book Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 48,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2BC7B2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelName: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 16,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amenityText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  roomTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roomTypeText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  priceCard: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B73E8',
  },
  priceLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  mapPlaceholder: {
    backgroundColor: '#F3F4F6',
    height: 200,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mapText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  dateInputSection: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateInputText: {
    fontSize: 15,
    color: '#1F2937',
  },
  dateInputPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  availableDatesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  availableDatesText: {
    fontSize: 12,
    color: '#1B73E8',
    flex: 1,
  },
  footer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  footerPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  footerPriceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  footerPriceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: '#1B73E8',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
