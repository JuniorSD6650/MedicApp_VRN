const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para React Native Web
config.resolver.alias = {
  'react-native': 'react-native-web',
  'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface': 'react-native-web/dist/exports/ReactNativePrivateInterface',
  'react-native/Libraries/ReactNative/PaperUIManager': 'react-native-web/dist/exports/PaperUIManager', 
  'react-native/Libraries/ReactNative/BridgelessUIManager': 'react-native-web/dist/exports/BridgelessUIManager',
};

config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Extensiones de archivo para resolver
config.resolver.sourceExts = ['js', 'json', 'ts', 'tsx', 'jsx'];

// Extensiones para assets
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ttf', 'otf', 'woff', 'woff2'];

module.exports = config;
