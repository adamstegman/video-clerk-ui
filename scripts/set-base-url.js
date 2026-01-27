#!/usr/bin/env node
/**
 * Script to set the base URL in app.json for staging deployments.
 *
 * Usage: node scripts/set-base-url.js <base-url>
 * Example: node scripts/set-base-url.js /staging/pr-123
 */

const fs = require('fs');
const path = require('path');

const baseUrl = process.argv[2];

if (!baseUrl) {
  console.error('Error: Base URL is required');
  console.error('Usage: node scripts/set-base-url.js <base-url>');
  process.exit(1);
}

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));

// Set the base URL in the experiments section
if (!appJson.expo.experiments) {
  appJson.expo.experiments = {};
}
appJson.expo.experiments.baseUrl = baseUrl;

// Write the updated app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`✓ Set baseUrl to: ${baseUrl}`);
