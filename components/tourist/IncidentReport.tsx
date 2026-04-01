import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface IncidentReportProps {
  onBack: () => void;
  onSubmit: (payload: {
    bookingId?: number;
    incidentType: string;
    details: string;
    location?: string;
  }) => Promise<void> | void;
}

export function IncidentReport({ onBack, onSubmit }: IncidentReportProps) {
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [imageUploaded, setImageUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incidentTypes = [
    'Lost Item',
    'Safety Concern',
    'Scam/Fraud',
    'Accident',
    'Poor Service',
    'Other',
  ];

  const handleSubmit = async () => {
    if (!incidentType || !description) {
      Alert.alert('Required Fields', 'Please select an incident type and provide a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        incidentType,
        details: description.trim(),
        location: '46.5197°N, 6.6323°E',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F97316', '#EA580C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <Text style={styles.headerSubtitle}>Help us improve safety for everyone</Text>
      </LinearGradient>

      {/* Form */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Incident Type */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Incident Type</Text>
          <View style={styles.typeGrid}>
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setIncidentType(type)}
                style={[
                  styles.typeButton,
                  incidentType === type && styles.typeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    incidentType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#F97316" />
            <Text style={styles.cardTitle}>Description</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Please provide details about the incident..."
            value={description}
            onChangeText={(text) => {
              if (text.length <= 500) {
                setDescription(text);
              }
            }}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.characterCount}>{description.length}/500 characters</Text>
        </View>

        {/* Image Upload */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="upload" size={20} color="#F97316" />
            <Text style={styles.cardTitle}>Upload Image (Optional)</Text>
          </View>
          <TouchableOpacity
            onPress={() => setImageUploaded(!imageUploaded)}
            style={[
              styles.uploadContainer,
              imageUploaded && styles.uploadContainerActive,
            ]}
          >
            {imageUploaded ? (
              <View style={styles.uploadContent}>
                <View style={styles.uploadIconContainer}>
                  <MaterialCommunityIcons name="upload" size={32} color="#F97316" />
                </View>
                <Text style={styles.uploadedText}>Image uploaded</Text>
                <Text style={styles.uploadSubtext}>Tap to change</Text>
              </View>
            ) : (
              <View style={styles.uploadContent}>
                <MaterialCommunityIcons name="upload" size={48} color="#9CA3AF" />
                <Text style={styles.uploadText}>Upload a photo</Text>
                <Text style={styles.uploadSubtext}>JPG, PNG up to 10MB</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#F97316" />
            <Text style={styles.cardTitle}>Location</Text>
          </View>
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapContent}>
              <MaterialCommunityIcons name="map-marker" size={48} color="#9CA3AF" />
              <Text style={styles.mapTitle}>Current Location</Text>
              <Text style={styles.mapCoordinates}>46.5197°N, 6.6323°E</Text>
            </View>
          </View>
          <View style={styles.locationStatus}>
            <View style={styles.locationDot} />
            <Text style={styles.locationStatusText}>Location pinned automatically</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!incidentType || !description || isSubmitting}
          style={[
            styles.submitButton,
            (!incidentType || !description || isSubmitting) && styles.submitButtonDisabled,
          ]}
        >
          <LinearGradient
            colors={
              !incidentType || !description || isSubmitting
                ? ['#D1D5DB', '#D1D5DB']
                : ['#F97316', '#EA580C']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ Your report helps:</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Improve safety for other travelers</Text>
            <Text style={styles.infoItem}>• Alert relevant authorities</Text>
            <Text style={styles.infoItem}>• Track incident patterns</Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 80,
    gap: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#F97316',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 128,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  uploadContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadContainerActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadedText: {
    fontSize: 14,
    color: '#EA580C',
    marginBottom: 4,
    fontWeight: '600',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mapPlaceholder: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mapContent: {
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  mapCoordinates: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  locationStatusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 8,
  },
  infoList: {
    marginLeft: 16,
    gap: 4,
  },
  infoItem: {
    fontSize: 12,
    color: '#1E40AF',
  },
});
