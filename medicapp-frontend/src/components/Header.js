import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const Header = ({ title, subtitle, showLogo = false }) => {
  return (
    <View style={styles.container}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>MedicApp</Text>
        </View>
      )}
      
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  logo: {
    fontSize: SIZES.title2,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: SIZES.title3,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.body,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.base / 2,
  },
});

export default Header;
