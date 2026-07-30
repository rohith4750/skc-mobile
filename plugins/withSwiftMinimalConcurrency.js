const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to ensure SWIFT_STRICT_CONCURRENCY is set to 'minimal'
 * in Podfile post_install to prevent Xcode 16 Swift 6 concurrency build errors.
 */
const withSwiftMinimalConcurrency = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let contents = fs.readFileSync(podfilePath, 'utf-8');
        if (!contents.includes("SWIFT_STRICT_CONCURRENCY")) {
          const postInstallSnippet = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
      end
    end
`;
          if (contents.includes('post_install do |installer|')) {
            contents = contents.replace(
              'post_install do |installer|',
              `post_install do |installer|${postInstallSnippet}`
            );
          } else {
            contents += `\npost_install do |installer|\n${postInstallSnippet}\nend\n`;
          }
          fs.writeFileSync(podfilePath, contents, 'utf-8');
        }
      }
      return config;
    },
  ]);
};

module.exports = withSwiftMinimalConcurrency;
