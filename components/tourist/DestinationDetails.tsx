import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { mockGuides, mockHotels } from '../../data/mockData';

interface Destination {
  id: string;
  name: string;
  image: string;
  rating: number;
  location: string;
  category: string;
  difficulty: string;
  duration: string;
  bestTime: string;
  description: string;
  activities: string[];
  highlights: string[];
  price: string;
}

interface DestinationDetailsProps {
  destination: Destination;
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

export function DestinationDetails({ destination, onBack, onNavigate }: DestinationDetailsProps) {
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

  const getMinimumDurationDays = (durationLabel: string) => {
    const match = String(durationLabel || '').match(/\d+/);
    const parsed = match ? Number.parseInt(match[0], 10) : 1;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  };

  const normalize = (value?: string) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const tokenize = (value?: string) =>
    normalize(value)
      .split(' ')
      .filter((token) => token.length >= 3 && token !== 'nepal');

  const destinationLocationTokens = Array.from(new Set(tokenize(destination.location)));
  const minimumDurationDays = getMinimumDurationDays(destination.duration);
  const destinationThemeTokens = Array.from(
    new Set(
      [destination.name, destination.category, ...destination.activities].flatMap((entry) =>
        tokenize(entry)
      )
    )
  );

  // Match guides by destination location first; if absent, fallback to relevant specialties.
  const availableGuides = mockGuides.filter((guide: any) => {
    if (!guide.verified) {
      return false;
    }

    const specialityLocations = Array.isArray(guide.specialityLocations)
      ? guide.specialityLocations
      : [];

    const guideSearchText = normalize(
      [guide.location, guide.bio, ...(guide.specialties || []), ...specialityLocations].join(' ')
    );

    const hasLocationMatch = destinationLocationTokens.some((token) =>
      guideSearchText.includes(token)
    );

    if (hasLocationMatch) {
      return true;
    }

    return destinationThemeTokens.some((token) => guideSearchText.includes(token));
  });

  // Get nearby hotels (mock for now)
  const nearbyHotels = mockHotels.slice(0, 2);

  const handleExploreHotels = () => {
    Alert.alert(
      'Browse Hotels',
      'Find the perfect accommodation for your stay',
      [{ text: 'OK' }]
    );
    onNavigate('explore-hotels');
  };

  const difficultyColors = getDifficultyColor(destination.difficulty);

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: destination.image }}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
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
              <Text style={styles.title}>{destination.name}</Text>
              <View style={styles.ratingBadge}>
                <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
                <Text style={styles.ratingText}>{destination.rating}</Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#6B7280" />
              <Text style={styles.locationText}>{destination.location}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{destination.category}</Text>
            </View>
          </View>

          {/* Quick Info */}
          <View style={styles.card}>
            <View style={styles.quickInfoGrid}>
              <View style={styles.quickInfoItem}>
                <View style={styles.quickInfoLabel}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
                  <Text style={styles.quickInfoLabelText}>Duration</Text>
                </View>
                <Text style={styles.quickInfoValue}>{destination.duration}</Text>
              </View>
              <View style={styles.quickInfoItem}>
                <View style={styles.quickInfoLabel}>
                  <MaterialCommunityIcons name="trending-up" size={16} color="#6B7280" />
                  <Text style={styles.quickInfoLabelText}>Best Time</Text>
                </View>
                <Text style={styles.quickInfoValue}>{destination.bestTime}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About This Destination</Text>
            <Text style={styles.description}>{destination.description}</Text>
          </View>

          {/* Activities */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activities & Experiences</Text>
            <View style={styles.tagsContainer}>
              {destination.activities.map((activity) => (
                <View key={activity} style={styles.activityTag}>
                  <Text style={styles.activityTagText}>{activity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Highlights */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Highlights</Text>
            <View style={styles.highlightsList}>
              {destination.highlights.map((highlight) => (
                <View key={highlight} style={styles.highlightItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#2BC7B2"
                  />
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Available Guides - Main Feature */}
          <View style={styles.guidesCard}>
            <View style={styles.guidesHeader}>
              <View style={styles.guidesHeaderLeft}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color="#1B73E8"
                />
                <Text style={styles.guidesTitle}>Available Local Guides</Text>
              </View>
              <View style={styles.guidesBadge}>
                <Text style={styles.guidesBadgeText}>
                  {availableGuides.length} guides
                </Text>
              </View>
            </View>

            {availableGuides.length > 0 ? (
              <View style={styles.guidesList}>
                {availableGuides.map((guide: any) => (
                  <View key={guide.id} style={styles.guideCard}>
                    <View style={styles.guideContent}>
                      <Image
                        source={typeof guide.photo === 'string' ? { uri: guide.photo } : guide.photo}
                        style={styles.guidePhoto}
                      />
                      <View style={styles.guideInfo}>
                        <View style={styles.guideHeaderRow}>
                          <View style={styles.guideNameContainer}>
                            <Text style={styles.guideName}>{guide.name}</Text>
                            {guide.verified && (
                              <MaterialCommunityIcons
                                name="check-circle"
                                size={14}
                                color="#2BC7B2"
                              />
                            )}
                          </View>
                          <View style={styles.guidePriceContainer}>
                            <Text style={styles.guidePrice}>{guide.pricePerDay}</Text>
                            <Text style={styles.guidePriceLabel}>per day</Text>
                          </View>
                        </View>

                        <View style={styles.guideMetaRow}>
                          <MaterialCommunityIcons name="star" size={12} color="#FFC107" />
                          <Text style={styles.guideMetaText}>{guide.rating}</Text>
                          <Text style={styles.guideMetaText}>•</Text>
                          <Text style={styles.guideMetaText}>{guide.experience}</Text>
                        </View>

                        <View style={styles.guideSpecialties}>
                          {guide.specialties.slice(0, 2).map((specialty: string) => (
                            <View key={specialty} style={styles.specialtyTag}>
                              <Text style={styles.specialtyTagText}>{specialty}</Text>
                            </View>
                          ))}
                        </View>

                        <TouchableOpacity
                          style={styles.selectGuideButton}
                          onPress={() =>
                            onNavigate('guide-profile', {
                              ...guide,
                              minDurationDays: minimumDurationDays,
                              minDurationLabel: destination.duration,
                              destinationName: destination.name,
                            })
                          }
                        >
                          <Text style={styles.selectGuideButtonText}>Select Guide</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noGuidesContainer}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={48}
                  color="#9CA3AF"
                />
                <Text style={styles.noGuidesText}>
                  No guides available for this destination yet
                </Text>
              </View>
            )}
          </View>

          {/* Hotels Section */}
          <View style={styles.card}>
            <View style={styles.hotelsHeader}>
              <View style={styles.hotelsHeaderLeft}>
                <MaterialCommunityIcons name="office-building" size={20} color="#1B73E8" />
                <Text style={styles.cardTitle}>Accommodation (Optional)</Text>
              </View>
              <TouchableOpacity onPress={handleExploreHotels}>
                <Text style={styles.browseAllText}>Browse All</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.hotelsSubtitle}>
              Find the perfect place to stay during your adventure
            </Text>

            <View style={styles.hotelsList}>
              {nearbyHotels.map((hotel) => (
                <TouchableOpacity
                  key={hotel.id}
                  style={styles.hotelCard}
                  onPress={() => onNavigate('hotel-details', hotel)}
                >
                  <Image
                    source={{ uri: hotel.image }}
                    style={styles.hotelImage}
                  />
                  <View style={styles.hotelInfo}>
                    <Text style={styles.hotelName}>{hotel.name}</Text>
                    <View style={styles.hotelRating}>
                      <MaterialCommunityIcons name="star" size={12} color="#FFC107" />
                      <Text style={styles.hotelRatingText}>{hotel.rating}</Text>
                    </View>
                    <Text style={styles.hotelPrice}>{hotel.pricePerNight}/night</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Package Info */}
          <View style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#1E3A8A" />
              <Text style={styles.packageTitle}>Package Information</Text>
            </View>
            <Text style={styles.packageText}>
              Base package starts from{' '}
              <Text style={styles.packagePrice}>{destination.price}</Text> per person
            </Text>
            <Text style={styles.packageNote}>
              💡 <Text style={styles.packageNoteStrong}>Note:</Text> Select a local guide
              to customize your experience. Hotel booking is optional and can be added
              separately.
            </Text>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
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
  },
  headerImage: {
    width: '100%',
    height: 256,
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 15,
    color: '#6B7280',
  },
  categoryBadge: {
    backgroundColor: '#1B73E8',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  quickInfoItem: {
    flex: 1,
  },
  quickInfoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  quickInfoLabelText: {
    fontSize: 13,
    color: '#6B7280',
  },
  quickInfoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activityTagText: {
    fontSize: 13,
    color: '#374151',
  },
  highlightsList: {
    gap: 8,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  guidesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(27, 115, 232, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guidesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  guidesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  guidesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  guidesBadge: {
    backgroundColor: '#1B73E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  guidesBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  guidesList: {
    gap: 12,
  },
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guideContent: {
    flexDirection: 'row',
    gap: 12,
  },
  guidePhoto: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  guideNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  guideName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  guidePriceContainer: {
    alignItems: 'flex-end',
  },
  guidePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B73E8',
  },
  guidePriceLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  guideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  guideMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  guideSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  specialtyTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specialtyTagText: {
    fontSize: 11,
    color: '#374151',
  },
  selectGuideButton: {
    backgroundColor: '#1B73E8',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectGuideButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  noGuidesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noGuidesText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  hotelsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hotelsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  browseAllText: {
    color: '#1B73E8',
    fontSize: 13,
    fontWeight: '600',
  },
  hotelsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  hotelsList: {
    gap: 12,
  },
  hotelCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  hotelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  hotelRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  hotelRatingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  hotelPrice: {
    fontSize: 14,
    color: '#1B73E8',
    fontWeight: '600',
  },
  packageCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  packageText: {
    fontSize: 13,
    color: '#1E3A8A',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '600',
  },
  packageNote: {
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },
  packageNoteStrong: {
    fontWeight: '600',
  },
});
