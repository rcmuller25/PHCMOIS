import 'dotenv/config';

const getEnvVar = (key, fallback = '') => {
  const value = process.env[key];
  if (!value && !__DEV__) {
    console.warn(`Missing environment variable: ${key}`);
  }
  return value || fallback;
};

export default {
  expo: {
    name: 'PHMOS',  // Primary Healthcare Mobile Outreach System
    slug: 'phmos',
    scheme: 'phmos',
    version: '0.1.6',  // Beta
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.caledonclinic.phmos',
      buildNumber: '0.1.6',
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
        UIViewControllerBasedStatusBarAppearance: true
      }
    },
    android: {
      package: 'com.caledonclinic.phmos',
      versionCode: 2,  // Incremented for new release
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#ffffff'
      },
      softwareKeyboardLayoutMode: 'pan',
      permissions: [
        'CAMERA',
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'FOREGROUND_SERVICE',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'WAKE_LOCK'
      ],
      useNextNotificationsApi: true
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      [
        'expo-secure-store',
        {
          faceIDPermission: 'Allow PHMOS to access your Face ID biometric data to authenticate you.'
        }
      ],
      [
        'expo-screen-orientation',
        {
          initialOrientation: 'DEFAULT'
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true
    }
    },
    extra: {
      router: {
        origin: false
    },
    updates: {
      url: 'https://u.expo.dev/420fbca4-a246-4d3b-be83-2d64eaadf5f6'
    },
    runtimeVersion: {
      policy: 'sdkVersion'
    },
    scheme: 'phmos',
    hooks: {
      postPublish: [
        {
          file: 'sentry-expo/upload-sourcemaps'
        }
      ]
    }
  }
};