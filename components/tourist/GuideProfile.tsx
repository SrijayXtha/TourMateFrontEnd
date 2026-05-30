import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { authAPI } from '../../constants/api';
import { TouristTopBar } from '../common/TouristTopBar';
import { SaveToCollectionModal } from './SaveToCollectionModal';
import {
  isItemSaved,
  loadSavedCollections,
  SavedCollection,
  saveItemToCollections,
} from './savedCollections';

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
  minDurationDays?: number;
  minDurationLabel?: string;
  destinationName?: string;
  destinations?: { destinationId?: number; name: string; location?: string }[];
}

interface GuideProfileProps {
  guide: Guide;
  onBack: () => void;
  onBook: (startDate: string, endDate: string) => void;
  onMessage?: () => void;
}

export function GuideProfile({ guide, onBack, onBook, onMessage }: GuideProfileProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end'>('start');
  const [userId, setUserId] = useState<number | null>(null);
  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [savingToCollection, setSavingToCollection] = useState(false);
  const [saved, setSaved] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseIsoDate = (value: string): Date | null => {
    const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
    if (!year || !month || !day) {
      return null;
    }

    const parsed = new Date(year, month - 1, day);
    parsed.setHours(0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const startDateValue = parseIsoDate(startDate);
  const endDateValue = parseIsoDate(endDate);
  const minimumDurationDays = Math.max(1, Number(guide.minDurationDays) || 1);
  const minimumDurationLabel = guide.minDurationLabel || `${minimumDurationDays} days`;
  const pickerDisplay = Platform.OS === 'ios' ? 'spinner' : 'calendar';
  const iosPickerAppearance =
    Platform.OS === 'ios'
      ? {
          textColor: '#111827',
          accentColor: '#1B73E8',
          themeVariant: 'light' as const,
        }
      : {};

  const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    next.setHours(0, 0, 0, 0);
    return next;
  };

  const minimumEndDate = addDays(startDateValue || today, minimumDurationDays);

  const experienceLabel = (() => {
    const rawValue = String(guide.experience || '').trim();
    if (!rawValue) {
      return 'Experience not specified';
    }

    const lowerValue = rawValue.toLowerCase();
    if (
      lowerValue.includes('experience') ||
      lowerValue.endsWith('exp') ||
      lowerValue.includes('year')
    ) {
      return rawValue;
    }

    return `${rawValue} experience`;
  })();

  useEffect(() => {
    const loadSaveState = async () => {
      const currentUser = await authAPI.getCurrentUser();
      const resolvedUserId = Number(currentUser?.user_id || currentUser?.id || 0) || null;
      const collections = await loadSavedCollections(resolvedUserId);
      setUserId(resolvedUserId);
      setSavedCollections(collections);
      setSaved(isItemSaved(collections, 'guide', String(guide.id)));
    };

    void loadSaveState();
  }, [guide.id]);

  const handleMessageGuide = () => {
    if (onMessage) {
      onMessage();
      return;
    }

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

    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    if (!start || !end) {
      Alert.alert('Invalid Date', 'Please choose valid booking dates.');
      return;
    }

    const requiredEndDate = addDays(start, minimumDurationDays);
    if (end < requiredEndDate) {
      Alert.alert(
        'Minimum Duration Required',
        `This trip requires at least ${minimumDurationLabel}. Please choose an end date on or after ${requiredEndDate.toLocaleDateString('en-US')}.`
      );
      return;
    }

    onBook(startDate, endDate);
  };

  const handleShareProfile = async () => {
    const shareLink = `https://tourmate.app/guide/${encodeURIComponent(String(guide.id))}`;
    await Share.share({
      message: `Check out guide ${guide.name} on TourMate: ${shareLink}`,
      url: shareLink,
      title: `${guide.name} - TourMate`,
    });
  };

  const handleSaveGuide = async (collectionId: string) => {
    setSavingToCollection(true);
    try {
      const collections = await saveItemToCollections(userId, collectionId, {
        id: `guide_${guide.id}`,
        entityId: String(guide.id),
        entityType: 'guide',
        title: guide.name,
        subtitle: guide.location || guide.destinations?.map((destination) => destination.name).join(', '),
        image: guide.photo,
        savedAt: new Date().toISOString(),
      });
      setSavedCollections(collections);
      setSaved(true);
      setSaveModalVisible(false);
      Alert.alert('Saved', 'This guide has been added to your selected collection and Saved folder.');
    } catch (error: any) {
      Alert.alert('Save Failed', error?.message || 'Unable to save this guide right now.');
    } finally {
      setSavingToCollection(false);
    }
  };

  const formatInputDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US');
  };

  const handleStartPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowStartPicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    selectedDate.setHours(0, 0, 0, 0);
    const isoStartDate = toIsoDate(selectedDate);
    const minAllowedEndDate = addDays(selectedDate, minimumDurationDays);
    const isoMinimumEndDate = toIsoDate(minAllowedEndDate);

    setStartDate(isoStartDate);
    setEndDate(isoMinimumEndDate);

    if (endDateValue && endDateValue > minAllowedEndDate) {
      setEndDate(toIsoDate(endDateValue));
    }

    Alert.alert(
      'Minimum Duration Applied',
      `End date has been set to the minimum required duration (${minimumDurationLabel}). You can select a later end date if needed.`
    );
  };

  const handleEndPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowEndPicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    selectedDate.setHours(0, 0, 0, 0);
    const minEndDate = addDays(startDateValue || today, minimumDurationDays);
    if (selectedDate < minEndDate) {
      Alert.alert(
        'Minimum Duration Required',
        `End date cannot be before the minimum duration (${minimumDurationLabel}).`
      );
      return;
    }

    setEndDate(toIsoDate(selectedDate));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <TouristTopBar title={guide.name} subtitle="Guide Profile" onBack={onBack} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {false ? (
        <View style={styles.compactProfileCard}>
          <Image
            source={typeof guide.photo === 'string' ? { uri: guide.photo } : guide.photo}
            style={styles.compactProfileImage}
          />
          <View style={styles.compactProfileInfo}>
            <Text style={styles.compactProfileName}>{guide.name}</Text>
            <View style={styles.compactMetaRow}>
              <MaterialCommunityIcons name="star" size={13} color="#FFC107" />
              <Text style={styles.compactMetaText}>{guide.rating}</Text>
              <Text style={styles.compactMetaDot}>•</Text>
              <Text style={styles.compactMetaText}>{guide.experience} exp</Text>
            </View>
          </View>
          {guide.verified ? (
            <MaterialCommunityIcons name="check-circle" size={18} color="#2BC7B2" />
          ) : null}
        </View>
        ) : null}

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
                <TouchableOpacity
                  style={styles.saveIconButton}
                  onPress={() => setSaveModalVisible(true)}
                >
                  <MaterialCommunityIcons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color="#1B73E8"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.metaPills}>
                <View style={styles.metaPill}>
                  <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                  <Text style={styles.metaPillText}>
                    {guide.rating} ({guide.reviews?.length || 0} reviews)
                  </Text>
                </View>
                <View style={styles.metaPill}>
                  <MaterialCommunityIcons name="trophy-outline" size={14} color="#6B7280" />
                  <Text style={styles.metaPillText}>{experienceLabel}</Text>
                </View>
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

          {guide.destinations && guide.destinations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.languagesHeader}>
                <MaterialCommunityIcons name="map-marker-radius" size={18} color="#1B73E8" />
                <Text style={styles.sectionTitle}>Destinations</Text>
              </View>
              <View style={styles.tagsContainer}>
                {guide.destinations.map((destination, index) => (
                  <View
                    key={`${destination.name}-${index}`}
                    style={styles.languageTag}
                  >
                    <Text style={styles.languageTagText}>{destination.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pricing */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <View style={styles.pricingLabel}>
                <MaterialCommunityIcons name="cash" size={20} color="#1B73E8" />
                <Text style={styles.pricingText}>Price per day</Text>
              </View>
              <Text style={styles.priceAmount}>{guide.pricePerDay}</Text>
            </View>
          </View>
        </View>

        {/* Booking Dates */}
        <View style={styles.card}>
          <View style={styles.availabilityHeader}>
            <MaterialCommunityIcons name="calendar" size={20} color="#1B73E8" />
            <Text style={styles.cardTitle}>Select Booking Dates</Text>
          </View>

          <Text style={styles.dateLabel}>Start Date</Text>
          <TouchableOpacity
            onPress={() => {
              setActiveDateField('start');
              setShowStartPicker(true);
            }}
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
            onPress={() => {
              if (!startDate) {
                Alert.alert('Select Start Date', 'Please select your start date first.');
                return;
              }
              setActiveDateField('end');
              setShowEndPicker(true);
            }}
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

          {showStartPicker && (
            <View style={styles.pickerSurface}>
              <DateTimePicker
                value={startDateValue || today}
                mode="date"
                display={pickerDisplay}
                minimumDate={today}
                onChange={handleStartPickerChange}
                {...iosPickerAppearance}
              />
            </View>
          )}

          {showEndPicker && (
            <View style={styles.pickerSurface}>
              <DateTimePicker
                value={endDateValue || startDateValue || today}
                mode="date"
                display={pickerDisplay}
                minimumDate={minimumEndDate}
                onChange={handleEndPickerChange}
                {...iosPickerAppearance}
              />
            </View>
          )}

          <View style={styles.availableDatesInfo}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={14} color="#1B73E8" />
            <Text style={styles.availableDatesText}>
              {guide.destinationName
                ? `${guide.destinationName} requires a minimum tour duration of ${minimumDurationLabel}. End date auto-sets to the minimum and you can only extend it.`
                : `Minimum tour duration is ${minimumDurationLabel}. End date auto-sets to the minimum and you can only extend it.`}
            </Text>
          </View>
        </View>

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
        <TouchableOpacity style={styles.shareButton} onPress={() => void handleShareProfile()}>
          <MaterialCommunityIcons name="share-variant-outline" size={20} color="#1B73E8" />
          <Text style={styles.shareButtonText}>Share Profile</Text>
        </TouchableOpacity>
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

      <SaveToCollectionModal
        visible={saveModalVisible}
        collections={savedCollections}
        saving={savingToCollection}
        onClose={() => setSaveModalVisible(false)}
        onSelect={(collectionId) => void handleSaveGuide(collectionId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  headerWrap: {
    zIndex: 20,
    elevation: 20,
    overflow: 'hidden',
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
    marginTop: -4,
    zIndex: 1,
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
    alignItems: 'flex-start',
  },
  profileImage: {
    width: 84,
    height: 84,
    borderRadius: 16,
  },
  profileInfo: {
    flex: 1,
    paddingTop: 2,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  saveIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  name: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 'bold',
    color: '#000',
    flexWrap: 'wrap',
    flex: 1,
  },
  metaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaPillText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
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
  pickerSurface: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    overflow: 'hidden',
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
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B73E8',
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
