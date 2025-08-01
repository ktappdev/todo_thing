import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Colors
export const colors = {
  primary: '#6200EE',
  primaryLight: '#BB86FC',
  primaryDark: '#3700B3',
  secondary: '#03DAC6',
  secondaryDark: '#018786',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  error: '#B00020',
  onPrimary: '#FFFFFF',
  onSecondary: '#000000',
  onBackground: '#000000',
  onSurface: '#000000',
  onError: '#FFFFFF',
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    hint: '#9E9E9E',
  },
  divider: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  category: {
    CHORES: '#4CAF50',
    SHOPPING: '#2196F3',
    WORK: '#FF9800',
    GENERAL: '#9E9E9E',
  },
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System-Medium',
    bold: 'System-Bold',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    xxxxl: 32,
  },
  lineHeight: {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
    xxxl: 36,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Global Styles
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },
  text: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
  },
  successText: {
    color: colors.success,
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  listItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  listItemTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  listItemSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
});

// Responsive Styles
export const responsive = {
  widthPercentage: (percentage: number) => (width * percentage) / 100,
  heightPercentage: (percentage: number) => (height * percentage) / 100,
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 768,
  isLargeDevice: width >= 768,
};

// Platform Specific Styles
export const platformStyles = StyleSheet.create({
  // Add platform-specific styles here if needed
});

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  globalStyles,
  responsive,
  platformStyles,
};