const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// expo-sqlite ships its WASM module as a binary asset that Metro must
// bundle alongside the JS. Without this, the web worker fails to load
// wa-sqlite.wasm and the app crashes on first DB access.
config.resolver.assetExts.push('wasm');

// expo-sqlite's web worker is an ES module — Metro needs `package.json#exports`
// resolution turned on so it resolves the worker correctly.
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: './global.css' });
