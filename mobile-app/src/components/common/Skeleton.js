// src/components/common/Skeleton.js
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../theme';

const { width } = Dimensions.get('window');

const Skeleton = ({ width: w, height: h, borderRadius = 8, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: w,
          height: h,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// ─── Preset Skeletons ─────────────────────────────────────────

export const ProductCardSkeleton = () => (
  <View style={styles.productCard}>
    <Skeleton width="100%" height={140} borderRadius={12} />
    <View style={styles.productCardContent}>
      <Skeleton width="80%" height={12} borderRadius={6} style={styles.mb8} />
      <Skeleton width="60%" height={12} borderRadius={6} style={styles.mb8} />
      <Skeleton width="40%" height={16} borderRadius={6} />
    </View>
  </View>
);

export const OrderCardSkeleton = () => (
  <View style={styles.orderCard}>
    <Skeleton width={65} height={65} borderRadius={8} />
    <View style={styles.orderCardContent}>
      <Skeleton width="70%" height={14} borderRadius={6} style={styles.mb8} />
      <Skeleton width="50%" height={12} borderRadius={6} style={styles.mb8} />
      <Skeleton width="40%" height={12} borderRadius={6} />
    </View>
  </View>
);

export const ProfileSkeleton = () => (
  <View style={styles.profileSkeleton}>
    <Skeleton width={80} height={80} borderRadius={40} style={styles.mb16} />
    <Skeleton width={140} height={16} borderRadius={8} style={styles.mb8} />
    <Skeleton width={100} height={12} borderRadius={6} />
  </View>
);

export const NotificationSkeleton = () => (
  <View style={styles.notificationCard}>
    <Skeleton width={44} height={44} borderRadius={22} />
    <View style={styles.notificationContent}>
      <Skeleton width="70%" height={14} borderRadius={6} style={styles.mb8} />
      <Skeleton width="90%" height={12} borderRadius={6} style={styles.mb8} />
      <Skeleton width="30%" height={10} borderRadius={6} />
    </View>
  </View>
);

export const CategorySkeleton = () => (
  <View style={styles.categorySkeleton}>
    <Skeleton width={50} height={50} borderRadius={25} style={styles.mb8} />
    <Skeleton width={50} height={10} borderRadius={5} />
  </View>
);

export const BannerSkeleton = () => (
  <Skeleton
    width={width - 40}
    height={160}
    borderRadius={16}
    style={styles.bannerSkeleton}
  />
);

// ─── Grid Skeletons ───────────────────────────────────────────

export const ProductGridSkeleton = ({ count = 6 }) => {
  const PRODUCT_WIDTH = (width - 40 - 12) / 2;

  return (
    <View style={styles.productGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.productGridItem,
            { width: PRODUCT_WIDTH },
          ]}
        >
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
};

export const OrderListSkeleton = ({ count = 5 }) => (
  <View style={styles.orderList}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.orderListItem}>
        <OrderCardSkeleton />
      </View>
    ))}
  </View>
);

export const HomeScreenSkeleton = () => (
  <View style={styles.homeSkeleton}>
    {/* Search bar */}
    <Skeleton
      width={width - 40}
      height={44}
      borderRadius={12}
      style={styles.mb16}
    />

    {/* Banner */}
    <BannerSkeleton />

    {/* Categories */}
    <View style={styles.categoriesRow}>
      {Array.from({ length: 4 }).map((_, i) => (
        <CategorySkeleton key={i} />
      ))}
    </View>

    {/* Products */}
    <ProductGridSkeleton count={6} />
  </View>
);

export const CartItemSkeleton = () => (
  <View style={styles.cartItem}>
    <Skeleton width={80} height={80} borderRadius={12} />
    <View style={styles.cartItemContent}>
      <Skeleton
        width="80%"
        height={14}
        borderRadius={6}
        style={styles.mb8}
      />
      <Skeleton
        width="50%"
        height={12}
        borderRadius={6}
        style={styles.mb8}
      />
      <View style={styles.cartItemRow}>
        <Skeleton width={100} height={32} borderRadius={16} />
        <Skeleton width={60} height={16} borderRadius={6} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.lightGray,
  },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },

  // Product card
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productCardContent: {
    padding: 8,
  },

  // Product grid
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  productGridItem: {
    marginBottom: 12,
  },

  // Order card
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#EDE9DD',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  orderCardContent: {
    flex: 1,
    marginLeft: 12,
  },

  // Order list
  orderList: {
    paddingHorizontal: 20,
  },
  orderListItem: {
    marginBottom: 12,
  },

  // Profile
  profileSkeleton: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  // Notification
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },

  // Category
  categorySkeleton: {
    alignItems: 'center',
    width: 60,
  },

  // Banner
  bannerSkeleton: {
    marginHorizontal: 20,
    marginBottom: 16,
  },

  // Home
  homeSkeleton: {
    paddingTop: 16,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // Add inside styles object in Skeleton.js
cartItem: {
  flexDirection: 'row',
  backgroundColor: COLORS.white,
  borderRadius: 16,
  padding: 12,
  marginBottom: 12,
  alignItems: 'center',
},
cartItemContent: {
  flex: 1,
  marginLeft: 12,
},
cartItemRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 4,
},
});

export default Skeleton;