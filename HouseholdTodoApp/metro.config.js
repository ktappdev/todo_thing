const { getDefaultConfig } = require('expo/metro-config');

// Get the default Expo Metro configuration
const config = getDefaultConfig(__dirname);

// Modify the resolver configuration to disable package exports resolution
// This fixes the Hermes 'require' ReferenceError in Expo SDK 53
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false
};

module.exports = config;
