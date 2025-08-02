export const COLORS = {
  primary: '#2E86AB',
  secondary: '#A23B72', 
  accent: '#F18F01',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 8,
  padding: 16,
  margin: 16,

  // Font sizes
  largeTitle: 34,
  title1: 28,
  title2: 22,
  title3: 20,
  headline: 17,
  body: 17,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption1: 12,
  caption2: 11,

  // App dimensions
  width: 375,
  height: 812,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  semiBold: 'System',
  light: 'System',
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dark: {
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

const appTheme = { COLORS, SIZES, FONTS, SHADOWS };

export default appTheme;
