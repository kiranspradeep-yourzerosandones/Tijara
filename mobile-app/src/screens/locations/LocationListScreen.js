import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Loading, EmptyState, Card } from '../../components/common';
import { locationsAPI } from '../../api';

const LocationListScreen = ({ navigation }) => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await locationsAPI.getLocations();
      setLocations(response.data?.locations || []);
    } catch (error) {
      console.error('Load locations error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLocations();
  };

  const handleSetDefault = async (locationId) => {
    try {
      await locationsAPI.setDefaultLocation(locationId);
      loadLocations();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = (location) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${location.shopName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await locationsAPI.deleteLocation(location._id);
              loadLocations();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderLocation = ({ item }) => (
    <Card style={styles.locationCard}>
      <TouchableOpacity
        style={styles.locationContent}
        onPress={() => navigation.navigate('EditLocation', { location: item })}
      >
        <View style={styles.locationHeader}>
          <View style={styles.labelContainer}>
            <View style={styles.labelBadge}>
              <Text style={styles.labelText}>
                {item.displayLabel || item.label}
              </Text>
            </View>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </View>

        <Text style={styles.shopName}>{item.shopName}</Text>
        
        {item.contactPerson && (
          <Text style={styles.contactPerson}>{item.contactPerson}</Text>
        )}
        
        <Text style={styles.address}>{item.fullAddress}</Text>
        
        <Text style={styles.phone}>📞 {item.contactPhone}</Text>
      </TouchableOpacity>

      <View style={styles.locationActions}>
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(item._id)}
          >
            <Ionicons name="star-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditLocation', { location: item })}
        >
          <Ionicons name="pencil-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          <Text style={[styles.actionText, { color: COLORS.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (isLoading) {
    return <Loading fullScreen message="Loading addresses..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Addresses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddLocation')}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={locations}
        renderItem={renderLocation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="location-outline"
            title="No Addresses"
            message="Add a delivery address to place orders"
            actionText="Add Address"
            onAction={() => navigation.navigate('AddLocation')}
          />
        }
      />

      {/* Floating Add Button */}
      {locations.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddLocation')}
        >
          <Ionicons name="add" size={28} color={COLORS.black} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: SPACING.screenPadding,
    paddingBottom: 100,
  },
  locationCard: {
    marginBottom: SPACING.md,
    padding: 0,
    overflow: 'hidden',
  },
  locationContent: {
    padding: SPACING.cardPadding,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  labelBadge: {
    backgroundColor: COLORS.primaryLight + '30',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
  },
  labelText: {
    ...FONTS.labelSmall,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  defaultText: {
    ...FONTS.caption,
    color: COLORS.success,
  },
  shopName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  contactPerson: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  address: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  phone: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
  },
  locationActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  actionText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.screenPadding,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
});

export default LocationListScreen;