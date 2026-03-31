// src/components/search/SearchSuggestions.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { highlightMatches } from '../../utils/searchUtils';
import { getImageUrl, formatCurrency } from '../../utils/helpers';

const { width } = Dimensions.get('window');

const SearchSuggestions = ({
  suggestions = [],
  query = '',
  isLoading = false,
  recentSearches = [],
  trendingSearches = [], // Optional: trending/popular searches
  onSelectSuggestion,
  onSelectProduct,
  onSelectCategory,
  onClearRecent,
  onRemoveRecentItem, // Optional: remove single recent item
  onFillSearch, // Optional: fill search box without navigating
  visible = true,
}) => {
  if (!visible) return null;

  const hasContent = suggestions.length > 0 || recentSearches.length > 0 || isLoading;
  
  if (!hasContent && query.length < 1) return null;

  // Render highlighted text
  const renderHighlightedText = (text, searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) {
      return <Text style={styles.suggestionText}>{text}</Text>;
    }

    const parts = highlightMatches(text, searchQuery);
    
    return (
      <Text style={styles.suggestionText} numberOfLines={1}>
        {parts.map((part, index) => (
          <Text
            key={index}
            style={part.highlight ? styles.highlightedText : styles.normalText}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  // ============================================================
  // KEYWORD SUGGESTION (like "godrej wax")
  // ============================================================
  const renderKeywordSuggestion = (item, index) => (
    <TouchableOpacity
      key={`keyword_${index}`}
      style={styles.suggestionRow}
      onPress={() => onSelectSuggestion?.(item.title || item)}
      activeOpacity={0.6}
    >
      <View style={styles.suggestionLeft}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray} />
        <View style={styles.suggestionTextContainer}>
          {renderHighlightedText(item.title || item, query)}
        </View>
      </View>
      
      {/* Arrow to fill search box */}
      <TouchableOpacity
        style={styles.fillButton}
        onPress={() => onFillSearch?.(item.title || item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-up-outline" size={16} color={COLORS.gray} style={styles.fillIcon} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // ============================================================
  // CATEGORY SUGGESTION (like "godrej wax in Wax Products")
  // ============================================================
  const renderCategorySuggestion = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.suggestionRow}
      onPress={() => onSelectCategory?.(item.title)}
      activeOpacity={0.6}
    >
      <View style={styles.suggestionLeft}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray} />
        <View style={styles.suggestionTextContainer}>
          <Text style={styles.suggestionText} numberOfLines={1}>
            {query && <Text style={styles.highlightedText}>{query}</Text>}
            <Text style={styles.inCategoryText}> in </Text>
            <Text style={styles.categoryName}>{item.title}</Text>
          </Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
    </TouchableOpacity>
  );

  // ============================================================
  // PRODUCT SUGGESTION (with image, title, price)
  // ============================================================
  const renderProductSuggestion = (item) => {
    const imageUrl = item.image ? getImageUrl(item.image) : null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.productRow}
        onPress={() => onSelectProduct?.(item.product)}
        activeOpacity={0.6}
      >
        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="cube-outline" size={20} color={COLORS.lightGray} />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {renderHighlightedText(item.title, query)}
          <View style={styles.productMeta}>
            {item.category && (
              <Text style={styles.productCategory} numberOfLines={1}>
                {item.category}
              </Text>
            )}
            {item.price && (
              <Text style={styles.productPrice}>
                {formatCurrency(item.price)}
              </Text>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={COLORS.lightGray} />
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RECENT SEARCH ITEM
  // ============================================================
  const renderRecentSearch = (searchTerm, index) => (
    <TouchableOpacity
      key={`recent_${index}`}
      style={styles.suggestionRow}
      onPress={() => onSelectSuggestion?.(searchTerm)}
      activeOpacity={0.6}
    >
      <View style={styles.suggestionLeft}>
        <Ionicons name="time-outline" size={18} color={COLORS.gray} />
        <View style={styles.suggestionTextContainer}>
          <Text style={styles.suggestionText} numberOfLines={1}>
            {searchTerm}
          </Text>
        </View>
      </View>

      <View style={styles.recentActions}>
        {/* Arrow to fill search */}
        <TouchableOpacity
          style={styles.fillButton}
          onPress={() => onFillSearch?.(searchTerm)}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        >
          <Ionicons name="arrow-up-outline" size={16} color={COLORS.gray} style={styles.fillIcon} />
        </TouchableOpacity>
        
        {/* Remove button */}
        {onRemoveRecentItem && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemoveRecentItem?.(searchTerm)}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
          >
            <Ionicons name="close" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // ============================================================
  // TRENDING SEARCH ITEM
  // ============================================================
  const renderTrendingSearch = (searchTerm, index) => (
    <TouchableOpacity
      key={`trending_${index}`}
      style={styles.suggestionRow}
      onPress={() => onSelectSuggestion?.(searchTerm)}
      activeOpacity={0.6}
    >
      <View style={styles.suggestionLeft}>
        <Ionicons name="trending-up" size={18} color={COLORS.primary} />
        <View style={styles.suggestionTextContainer}>
          <Text style={styles.suggestionText} numberOfLines={1}>
            {searchTerm}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.fillButton}
        onPress={() => onFillSearch?.(searchTerm)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-up-outline" size={16} color={COLORS.gray} style={styles.fillIcon} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Separate suggestions by type
  const categorySuggestions = suggestions.filter(s => s.type === 'category');
  const productSuggestions = suggestions.filter(s => s.type === 'product');
  const keywordSuggestions = suggestions.filter(s => s.type === 'keyword');

  // Show recent/trending when query is short
  const showRecentAndTrending = query.length < 2;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Recent Searches */}
        {!isLoading && showRecentAndTrending && recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={onClearRecent} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.slice(0, 5).map((term, index) => renderRecentSearch(term, index))}
          </View>
        )}

        {/* Trending Searches */}
        {!isLoading && showRecentAndTrending && trendingSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Searches</Text>
            </View>
            {trendingSearches.slice(0, 5).map((term, index) => renderTrendingSearch(term, index))}
          </View>
        )}

        {/* Keyword Suggestions */}
        {!isLoading && keywordSuggestions.length > 0 && (
          <View style={styles.section}>
            {keywordSuggestions.map((item, index) => renderKeywordSuggestion(item, index))}
          </View>
        )}

        {/* Category Suggestions (in Category format) */}
        {!isLoading && categorySuggestions.length > 0 && (
          <View style={styles.section}>
            {categorySuggestions.map(item => renderCategorySuggestion(item))}
          </View>
        )}

        {/* Divider before products */}
        {!isLoading && productSuggestions.length > 0 && (categorySuggestions.length > 0 || keywordSuggestions.length > 0) && (
          <View style={styles.divider} />
        )}

        {/* Product Suggestions */}
        {!isLoading && productSuggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Products</Text>
            {productSuggestions.slice(0, 5).map(item => renderProductSuggestion(item))}
          </View>
        )}

        {/* No Results */}
        {!isLoading && query.length >= 2 && suggestions.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={40} color={COLORS.lightGray} />
            <Text style={styles.noResultsText}>No results for "{query}"</Text>
            <Text style={styles.noResultsHint}>
              Check spelling or try different keywords
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: 2,
    maxHeight: 400,
    ...SHADOWS.medium,
    zIndex: 9999,
    elevation: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.xs,
  },

  // ============================================================
  // LOADING
  // ============================================================
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // ============================================================
  // SECTIONS
  // ============================================================
  section: {
    paddingBottom: SPACING.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  divider: {
    height: 6,
    backgroundColor: '#F5F5F5',
    marginVertical: SPACING.xs,
  },

  // ============================================================
  // SUGGESTION ROW (Keywords, Recent, Trending)
  // ============================================================
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: SPACING.sm,
  },
  suggestionText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  normalText: {
    color: COLORS.textPrimary,
  },
  highlightedText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inCategoryText: {
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  categoryName: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // Fill button (arrow)
  fillButton: {
    padding: 6,
  },
  fillIcon: {
    transform: [{ rotate: '-45deg' }],
  },

  // Recent actions
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeButton: {
    padding: 6,
  },

  // ============================================================
  // PRODUCT ROW
  // ============================================================
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    minHeight: 60,
  },
  productImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#F8F8F8',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: SPACING.sm,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  productCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ============================================================
  // NO RESULTS
  // ============================================================
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default SearchSuggestions;