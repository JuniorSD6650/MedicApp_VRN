const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['react-native-screens'],
      },
    },
    argv
  );

  // Configurar alias para resolver problemas de React Native Web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native': 'react-native-web',
    'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface': 'react-native-web/dist/exports/ReactNativePrivateInterface',
    'react-native/Libraries/ReactNative/PaperUIManager': 'react-native-web/dist/exports/PaperUIManager',
    'react-native/Libraries/ReactNative/BridgelessUIManager': 'react-native-web/dist/exports/BridgelessUIManager',
  };

  // Configurar fallbacks para módulos no disponibles en web
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": false,
    "stream": false,
    "buffer": false,
  };

  return config;
};
