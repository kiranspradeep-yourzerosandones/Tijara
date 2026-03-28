// src/components/ShapeAdjuster.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';

const ShapeAdjuster = ({ onValuesChange, variant = 'dark' }) => {
  const [visible, setVisible] = useState(false);
  const isDark = variant === 'dark';

  // Shape 1 defaults
  const [s1Top, setS1Top] = useState(-20);
  const [s1Right, setS1Right] = useState(-40);
  const [s1Width, setS1Width] = useState(220);
  const [s1Height, setS1Height] = useState(220);
  const [s1Rotation, setS1Rotation] = useState(25);
  const [s1Radius, setS1Radius] = useState(30);

  // Shape 2 defaults
  const [s2Top, setS2Top] = useState(40);
  const [s2Right, setS2Right] = useState(-60);
  const [s2Width, setS2Width] = useState(220);
  const [s2Height, setS2Height] = useState(220);
  const [s2Rotation, setS2Rotation] = useState(25);
  const [s2Radius, setS2Radius] = useState(30);

  const updateValues = (key, value) => {
    const allValues = {
      s1Top, s1Right, s1Width, s1Height, s1Rotation, s1Radius,
      s2Top, s2Right, s2Width, s2Height, s2Rotation, s2Radius,
      [key]: value,
    };
    onValuesChange(allValues);
  };

  const sliderColor = isDark ? '#000' : '#F5C518';
  const textColor = isDark ? '#000' : '#FFF';
  const bgColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const labelColor = isDark ? '#333' : '#CCC';

  const renderSlider = (label, value, setter, key, min, max, step = 1) => (
    <View style={sliderStyles.sliderRow} key={key}>
      <Text style={[sliderStyles.label, { color: labelColor }]}>
        {label}: {Math.round(value)}
      </Text>
      <Slider
        style={sliderStyles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={(val) => {
          setter(val);
          updateValues(key, val);
        }}
        minimumTrackTintColor={sliderColor}
        maximumTrackTintColor="#999"
        thumbTintColor={sliderColor}
      />
    </View>
  );

  if (!visible) {
    return (
      <TouchableOpacity
        style={[sliderStyles.toggleButton, { backgroundColor: sliderColor }]}
        onPress={() => setVisible(true)}
      >
        <Text style={[sliderStyles.toggleText, { color: isDark ? '#FFF' : '#000' }]}>
          🎛️ Adjust
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[sliderStyles.panel, { backgroundColor: bgColor }]}>
      <View style={sliderStyles.panelHeader}>
        <Text style={[sliderStyles.panelTitle, { color: textColor }]}>
          🎛️ Shape Adjuster
        </Text>
        <TouchableOpacity onPress={() => setVisible(false)}>
          <Text style={[sliderStyles.closeBtn, { color: sliderColor }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={sliderStyles.scrollArea}
      >
        {/* Shape 1 */}
        <Text style={[sliderStyles.sectionTitle, { color: textColor }]}>
          ▸ Shape 1 (Back)
        </Text>
        {renderSlider('Top', s1Top, setS1Top, 's1Top', -200, 200)}
        {renderSlider('Right', s1Right, setS1Right, 's1Right', -200, 100)}
        {renderSlider('Width', s1Width, setS1Width, 's1Width', 50, 400)}
        {renderSlider('Height', s1Height, setS1Height, 's1Height', 50, 400)}
        {renderSlider('Rotation', s1Rotation, setS1Rotation, 's1Rotation', -90, 90)}
        {renderSlider('Radius', s1Radius, setS1Radius, 's1Radius', 0, 100)}

        {/* Shape 2 */}
        <Text style={[sliderStyles.sectionTitle, { color: textColor, marginTop: 16 }]}>
          ▸ Shape 2 (Front)
        </Text>
        {renderSlider('Top', s2Top, setS2Top, 's2Top', -200, 300)}
        {renderSlider('Right', s2Right, setS2Right, 's2Right', -200, 100)}
        {renderSlider('Width', s2Width, setS2Width, 's2Width', 50, 400)}
        {renderSlider('Height', s2Height, setS2Height, 's2Height', 50, 400)}
        {renderSlider('Rotation', s2Rotation, setS2Rotation, 's2Rotation', -90, 90)}
        {renderSlider('Radius', s2Radius, setS2Radius, 's2Radius', 0, 100)}

        {/* Copy Values */}
        <View style={sliderStyles.valuesBox}>
          <Text style={[sliderStyles.valuesTitle, { color: textColor }]}>
            📋 Copy these values:
          </Text>
          <Text style={sliderStyles.valuesText}>
            {`// Shape 1\nSHAPE1_TOP = ${Math.round(s1Top)}\nSHAPE1_RIGHT = ${Math.round(s1Right)}\nSHAPE1_WIDTH = ${Math.round(s1Width)}\nSHAPE1_HEIGHT = ${Math.round(s1Height)}\nSHAPE1_ROTATION = '${Math.round(s1Rotation)}deg'\nSHAPE1_BORDER_RADIUS = ${Math.round(s1Radius)}\n\n// Shape 2\nSHAPE2_TOP = ${Math.round(s2Top)}\nSHAPE2_RIGHT = ${Math.round(s2Right)}\nSHAPE2_WIDTH = ${Math.round(s2Width)}\nSHAPE2_HEIGHT = ${Math.round(s2Height)}\nSHAPE2_ROTATION = '${Math.round(s2Rotation)}deg'\nSHAPE2_BORDER_RADIUS = ${Math.round(s2Radius)}`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 999,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: 22,
    fontWeight: '700',
    padding: 4,
  },
  scrollArea: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  sliderRow: {
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  valuesBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderRadius: 12,
    marginBottom: 30,
  },
  valuesTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  valuesText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#F5C518',
    lineHeight: 18,
  },
});

export default ShapeAdjuster;