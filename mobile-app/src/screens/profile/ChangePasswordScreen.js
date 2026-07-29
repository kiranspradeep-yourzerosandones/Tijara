// src/screens/profile/ChangePasswordScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Screen } from '../../components/common';
import Toast from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import { changePassword } from '../../api/auth';

/* ─── Password strength ──────────────────────────────────── */
const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: '', color: COLORS.border };
  let score = 0;
  if (password.length >= 6)                  score++;
  if (password.length >= 8)                  score++;
  if (/[A-Z]/.test(password))               score++;
  if (/[0-9]/.test(password))               score++;
  if (/[^A-Za-z0-9]/.test(password))        score++;

  const levels = [
    { level: 0, label: '',             color: COLORS.border    },
    { level: 1, label: 'Weak',         color: '#EF4444'        },
    { level: 2, label: 'Fair',         color: '#F97316'        },
    { level: 3, label: 'Good',         color: '#EAB308'        },
    { level: 4, label: 'Strong',       color: '#22C55E'        },
    { level: 5, label: 'Very Strong',  color: '#10B981'        },
  ];
  return levels[score];
};

/* ─── Password field ─────────────────────────────────────── */
const PasswordField = ({
  label,
  value,
  onChange,
  error,
  focused,
  onFocus,
  onBlur,
  show,
  onToggle,
  placeholder,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View
      style={[
        styles.fieldWrapper,
        focused && styles.fieldWrapperFocused,
        error   && styles.fieldWrapperError,
      ]}
    >
      <Ionicons
        name="lock-closed-outline"
        size={18}
        color={error ? COLORS.error : focused ? COLORS.primary : COLORS.gray}
        style={styles.fieldIcon}
      />
      <TextInput
        style={styles.fieldInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeButton}>
        <Ionicons
          name={show ? 'eye-off-outline' : 'eye-outline'}
          size={18}
          color={COLORS.gray}
        />
      </TouchableOpacity>
    </View>
    {error ? (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle-outline" size={12} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null}
  </View>
);

/* ─── Main Screen ────────────────────────────────────────── */
const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors,    setErrors]    = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [focused,   setFocused]   = useState(null);
  const [show, setShow] = useState({
    current: false,
    new:     false,
    confirm: false,
  });

  const { toast, showToast } = useToast();

  const strength = getPasswordStrength(newPassword);

  const handleFocus   = useCallback((field) => () => setFocused(field), []);
  const handleBlur    = useCallback(() => setFocused(null), []);
  const toggleShow    = useCallback(
    (field) => () => setShow((s) => ({ ...s, [field]: !s[field] })),
    []
  );

  const clearError = useCallback((field) => {
    setErrors((e) => ({ ...e, [field]: '' }));
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.current = 'Current password is required.';
    }

    if (!newPassword) {
      newErrors.new = 'New password is required.';
    } else if (newPassword.length < 6) {
      newErrors.new = 'Password must be at least 6 characters.';
    } else if (newPassword === currentPassword) {
      newErrors.new = 'New password must be different from current password.';
    }

    if (!confirmPassword) {
      newErrors.confirm = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match.';
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      showToast('Password changed successfully!', 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err) {
      const message = err.data?.message || err.message || 'Failed to change password.';
      const lc      = message.toLowerCase();

      if (lc.includes('incorrect') || lc.includes('current') || lc.includes('wrong')) {
        setErrors({ current: 'Current password is incorrect.' });
      } else {
        showToast(message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Info banner ── */}
        <View style={styles.infoBanner}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={COLORS.primary}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.infoText}>
            Use a strong password with a mix of letters, numbers and symbols.
          </Text>
        </View>

        {/* ── Current password ── */}
        <PasswordField
          label="Current Password"
          placeholder="Enter your current password"
          value={currentPassword}
          onChange={(v) => { setCurrentPassword(v); clearError('current'); }}
          error={errors.current}
          focused={focused === 'current'}
          onFocus={handleFocus('current')}
          onBlur={handleBlur}
          show={show.current}
          onToggle={toggleShow('current')}
        />

        {/* ── New password ── */}
        <PasswordField
          label="New Password"
          placeholder="Enter your new password"
          value={newPassword}
          onChange={(v) => { setNewPassword(v); clearError('new'); }}
          error={errors.new}
          focused={focused === 'new'}
          onFocus={handleFocus('new')}
          onBlur={handleBlur}
          show={show.new}
          onToggle={toggleShow('new')}
        />

        {/* ── Strength indicator ── */}
        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor:
                        i <= strength.level ? strength.color : COLORS.border,
                    },
                  ]}
                />
              ))}
            </View>
            {strength.label ? (
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            ) : null}
          </View>
        )}

        {/* ── Confirm password ── */}
        <PasswordField
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChange={(v) => { setConfirmPassword(v); clearError('confirm'); }}
          error={errors.confirm}
          focused={focused === 'confirm'}
          onFocus={handleFocus('confirm')}
          onBlur={handleBlur}
          show={show.confirm}
          onToggle={toggleShow('confirm')}
        />

        {/* ── Match indicator ── */}
        {confirmPassword.length > 0 && (
          <View style={styles.matchRow}>
            <Ionicons
              name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={passwordsMatch ? '#22C55E' : COLORS.error}
            />
            <Text
              style={[
                styles.matchText,
                { color: passwordsMatch ? '#22C55E' : COLORS.error },
              ]}
            >
              {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </Text>
          </View>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.black} size="small" />
          ) : (
            <>
              <Ionicons
                name="lock-closed"
                size={18}
                color={COLORS.black}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitText}>Update Password</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </Screen>
  );
};

/* ─── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical:   SPACING.md,
    backgroundColor:   COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: COLORS.card,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title: { ...FONTS.h4, color: COLORS.textPrimary },

  scrollContent: {
    padding:       SPACING.screenPadding,
    paddingBottom: SPACING.xxxl,
  },

  infoBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.primary + '18',
    borderRadius:    12,
    padding:         SPACING.md,
    marginBottom:    SPACING.xl,
    borderWidth:     1,
    borderColor:     COLORS.primary + '30',
  },
  infoText: {
    flex:       1,
    fontSize:   13,
    color:      COLORS.textSecondary,
    lineHeight: 18,
  },

  /* Field */
  fieldContainer: { marginBottom: SPACING.lg },
  fieldLabel: {
    fontSize:     13,
    fontWeight:   '600',
    color:        COLORS.textPrimary,
    marginBottom: 6,
  },
  fieldWrapper: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  COLORS.white,
    borderRadius:     12,
    borderWidth:      1.5,
    borderColor:      COLORS.border,
    paddingHorizontal: SPACING.md,
    height:           52,
    ...SHADOWS.small,
  },
  fieldWrapperFocused: {
    borderColor:     COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  fieldWrapperError: {
    borderColor:     COLORS.error,
    backgroundColor: COLORS.error + '08',
  },
  fieldIcon:  { marginRight: 10 },
  fieldInput: {
    flex:      1,
    fontSize:  15,
    color:     COLORS.textPrimary,
    paddingVertical: 0,
  },
  eyeButton: { padding: 6 },

  errorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     5,
    marginLeft:    2,
  },
  errorText: { fontSize: 12, color: COLORS.error, flex: 1 },

  /* Strength */
  strengthContainer: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    marginTop:      -SPACING.sm,
    marginBottom:   SPACING.lg,
  },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: {
    flex:         1,
    height:       4,
    borderRadius: 2,
  },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 70 },

  /* Match */
  matchRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     -SPACING.sm,
    marginBottom:  SPACING.md,
    marginLeft:    2,
  },
  matchText: { fontSize: 12, fontWeight: '500' },

  /* Submit */
  submitButton: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: COLORS.primary,
    borderRadius:    14,
    height:          54,
    marginTop:       SPACING.lg,
    ...SHADOWS.medium,
    shadowColor:     COLORS.primary,
    shadowOpacity:   0.35,
  },
  submitButtonDisabled: { opacity: 0.65 },
  submitText: { fontSize: 16, fontWeight: '700', color: COLORS.black },
});

export default ChangePasswordScreen;