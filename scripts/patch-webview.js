const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '../node_modules/react-native-webview/android/build.gradle'
);

if (fs.existsSync(buildGradlePath)) {
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  if (content.includes('enableBundleCompression')) {
    content = content.replace(/\s*enableBundleCompression\s*=\s*false\s*/g, '\n');
    fs.writeFileSync(buildGradlePath, content, 'utf8');
    console.log('✅ Patched react-native-webview: removed enableBundleCompression');
  } else {
    console.log('ℹ️  react-native-webview: no patch needed');
  }
} else {
  console.log('⚠️  react-native-webview build.gradle not found');
}
