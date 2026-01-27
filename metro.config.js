const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Phase 1: Exclude old React Router app/ directory from Metro bundling
// (These will be migrated in Phase 2+)
config.resolver.blockList = [
  /app\/routes\/.*/,
  /app\/lib\/.*/,
  /app\/components\/.*/,
  /app\/list\/.*/,
  /app\/watch\/.*/,
  /app\/settings\/.*/,
  /app\/marketing\/.*/,
  /app\/tmdb-api\/.*/,
  /app\/test-utils\/.*/,
  /app\/app-data\/.*/,
  /app\/root\.tsx$/,
  /app\/routes\.ts$/,
  /app\/app\.css$/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
