// src/components/common/Screen.js
import React from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { COLORS } from '../../theme';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

// 🎯 ADJUST TOP PADDING HERE
const EXTRA_TOP_PADDING = 2; // ← Change this value to adjust top padding globally

const Screen = ({
  children,
  style,
  backgroundColor = COLORS.backgroundLight,
  statusBarStyle = 'dark-content',
  statusBarBackground,
  useSafeArea = true,
  extraTopPadding = EXTRA_TOP_PADDING, // ← Can override per screen
}) => {
  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackground || backgroundColor}
        translucent={Platform.OS === 'android'}
      />
      {Platform.OS === 'android' && (
        <View style={[
          styles.statusBarPadding, 
          { backgroundColor: statusBarBackground || backgroundColor }
        ]} />
      )}
      <Container style={[
        styles.content, 
        { paddingTop: extraTopPadding },
        style
      ]}>
        {children}
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarPadding: {
    height: STATUSBAR_HEIGHT,
  },
  content: {
    flex: 1,
  },
});

export default Screen;