module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-typescript',
      ['@babel/preset-react', { runtime: 'automatic' }]
    ],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': '.',
            '@/*': './*',
            '@/components': './components',
            '@/services': './src/services',
            '@/stores': './stores',
            '@/hooks': './hooks',
            '@/utils': './utils'
          },
        },
      ],
    ],
  };
};
