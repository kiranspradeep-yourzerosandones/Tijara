import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  variant = 'default', // default, underline
  containerStyle,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const isUnderline = variant === 'underline';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          isUnderline ? styles.inputWrapperUnderline : styles.inputWrapper,
          isFocused && (isUnderline ? styles.inputWrapperUnderlineFocused : styles.inputWrapperFocused),
          error && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon}
              size={20}
              color={isFocused ? COLORS.primary : COLORS.gray}
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            icon && styles.inputWithIcon,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...FONTS.label,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.inputRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: SPACING.inputHeight,
    paddingHorizontal: SPACING.md,
  },
  inputWrapperUnderline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    height: SPACING.inputHeight,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
  },
  inputWrapperUnderlineFocused: {
    borderBottomColor: COLORS.primary,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    borderBottomColor: COLORS.error,
  },
  inputWrapperDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.7,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...FONTS.input,
    color: COLORS.textPrimary,
    height: '100%',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  error: {
    ...FONTS.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});

export default Input;