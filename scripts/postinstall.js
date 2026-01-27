#!/usr/bin/env node
/**
 * Postinstall script to create a stub react-native-worklets plugin.
 *
 * This is needed because react-native v0.76.6's jest environment requires
 * react-native-worklets/plugin, but we've removed react-native-reanimated
 * for Phase 1 (it will be added back in Phase 4 with animations).
 *
 * The stub plugin is a no-op Babel plugin that satisfies the import.
 */

const fs = require('fs');
const path = require('path');

// Get project root (parent of scripts directory)
const projectRoot = path.join(__dirname, '..');
const workletsDirPath = path.join(projectRoot, 'node_modules', 'react-native-worklets');
const pluginFilePath = path.join(workletsDirPath, 'plugin.js');

// Create directory if it doesn't exist
if (!fs.existsSync(workletsDirPath)) {
  fs.mkdirSync(workletsDirPath, { recursive: true });
}

// Create stub plugin file
const stubPluginContent = `// Stub Babel plugin for react-native-worklets
// This is a no-op plugin created during postinstall to satisfy
// react-native's jest environment requirements.
module.exports = function() {
  return {
    name: 'react-native-worklets-stub',
    visitor: {}
  };
};
`;

fs.writeFileSync(pluginFilePath, stubPluginContent);

console.log('✓ Created stub react-native-worklets/plugin.js');
