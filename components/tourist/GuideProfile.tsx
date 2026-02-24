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

interface Review {
  user: string;
  rating: number;
  comment: string;
}

interface Guide {
  id: string;
  name: string;
  photo: string;
  rating: number;
  experience: string;
  specialties: string[];
  pricePerDay: string;
  verified: boolean;
  bio?: string;
  languages?: string[];
  location?: string;
  reviews?: Review[];
  availability?: string[];
}

interface GuideProfileProps {
  guide: Guide;
  onBack: () => void;
  onBook: (startDate: string, endDate: string) => void;
}

export function GuideProfile({ guide, onBack, onBook }: GuideProfileProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDateField, setActiveDateField] = useState<'start' | 'end'>('start');

  const handleMessageGuide = () => {
    Alert.alert(
      `Opening chat with ${guide.name}`,
      'Start a conversation to discuss your trip details',
      [{ text: 'OK' }]
    );
  };

  const handleBookNow = () => {
    if (!startDate || !endDate) {
      Alert.alert('Select Booking Dates', 'Please select both start and end dates to continue booking.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      Alert.alert('Invalid Date Range', 'End date must be the same as or after the start date.');
      return;
    }

    onBook(startDate, endDate);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatInputDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back to Guides</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image
              source={typeof guide.photo === 'string' ? { uri: guide.photo } : guide.photo}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{guide.name}</Text>
                {guide.verified && (
                  <MaterialCommunityIcons name="check-circle" size={20} color="#2BC7B2" />
                )}
              </View>
              
              <View style={styles.statsRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                <Text style={styles.statsText}>
                  {guide.rating} ({guide.reviews?.length || 0} reviews)
                </Text>
              </View>
              
              <View style={styles.experienceRow}>
                <MaterialCommunityIcons name="trophy" size={16} color="#666" />
                <Text style={styles.experienceText}>{guide.experience} experience</Text>
              </View>
            </View>
          </View>

          {/* Bio */}
          {guide.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{guide.bio}</Text>
            </View>
          )}

          {/* Specialties */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.tagsContainer}>
              {guide.specialties.map((specialty, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Languages */}
          {guide.languages && guide.languages.length > 0 && (
            <View style={styles.section}>
              <View style={styles.languagesHeader}>
                <MaterialCommunityIcons name="translate" size={18} color="#1B73E8" />
                <Text style={styles.sectionTitle}>Languages</Text>
              </View>
              <View style={styles.tagsContainer}>
                {guide.languages.map((lang, index) => (
                  <View key={index} style={styles.languageTag}>
                    <Text style={styles.languageTagText}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pricing */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <View style={styles.pricingLabel}>
                <MaterialCommunityIcons name="currency-usd" size={20} color="#1B73E8" />
                <Text style={styles.pricingText}>Price per day</Text>
              </View>
              <Text style={styles.priceAmount}>{guide.pricePerDay}</Text>
            </View>
          </View>
        </View>

        {/* Availability */}
        {guide.availability && guide.availability.length > 0 && (
          <View style={styles.card}>
            <View style={styles.availabilityHeader}>
              <MaterialCommunityIcons name="calendar" size={20} color="#1B73E8" />
              <Text style={styles.cardTitle}>Select Booking Dates</Text>
            </View>

            <Text style={styles.dateLabel}>Start Date</Text>
            <TouchableOpacity
              onPress={() => setActiveDateField('start')}
              style={[
                styles.dateInput,
                activeDateField === 'start' && styles.dateInputActive,
              ]}
            >
              <Text style={[styles.dateInputText, !startDate && styles.dateInputPlaceholder]}>
                {startDate ? formatInputDate(startDate) : 'mm/dd/yyyy'}
              </Text>
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#111827" />
            </TouchableOpacity>

            <Text style={styles.dateLabel}>End Date</Text>
            <TouchableOpacity
              onPress={() => setActiveDateField('end')}
              style={[
                styles.dateInput,
                activeDateField === 'end' && styles.dateInputActive,
              ]}
            >
              <Text style={[styles.dateInputText, !endDate && styles.dateInputPlaceholder]}>
                {endDate ? formatInputDate(endDate) : 'mm/dd/yyyy'}
              </Text>
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#111827" />
            </TouchableOpacity>

            <View style={styles.availableDatesInfo}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={14} color="#1B73E8" />
              <Text style={styles.availableDatesText}>
                Available dates: {guide.availability.map(formatDate).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Reviews */}
        {guide.reviews && guide.reviews.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reviews</Text>
            <View style={styles.reviewsList}>
              {guide.reviews.map((review, index) => (
                <View
                  key={index}
                  style={[
                    styles.reviewItem,
                    index !== guide.reviews!.length - 1 && styles.reviewItemBorder,
                  ]}
                >
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>{review.user}</Text>
                    <View style={styles.reviewRating}>
                      <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                      <Text style={styles.reviewRatingText}>{review.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacing for fixed footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Booking Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={handleMessageGuide}
        >
          <MaterialCommunityIcons name="message-text-outline" size={20} color="#1B73E8" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!startDate || !endDate) && styles.bookButtonDisabled,
          ]}
          onPress={handleBookNow}
          disabled={!startDate || !endDate}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1B73E8',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    flexWrap: 'wrap',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  experienceText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E8F4F8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#1B73E8',
    fontWeight: '500',
  },
  languagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  languageTag: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1B73E8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  languageTagText: {
    fontSize: 13,
    color: '#1B73E8',
  },
  pricingCard: {
    backgroundColor: 'rgba(27, 115, 232, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricingText: {
    fontSize: 15,
    color: '#666',
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B73E8',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  dateInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  dateInputActive: {
    borderColor: '#1B73E8',
  },
  dateInputText: {
    fontSize: 16,
    color: '#111827',
  },
  dateInputPlaceholder: {
    color: '#9CA3AF',
  },
  availableDatesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(27, 115, 232, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  availableDatesText: {
    flex: 1,
    fontSize: 13,
    color: '#1B73E8',
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    paddingBottom: 16,
  },
  reviewItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 13,
    color: '#666',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B73E8',
    backgroundColor: '#fff',
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B73E8',
  },
  bookButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1B73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
