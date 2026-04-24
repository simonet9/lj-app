module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@hooks': './src/hooks',
            '@context': './src/context',
            '@services': './src/services',
            '@utils': './src/utils',
            '@constants': './src/constants',
            '@app-types': './src/types',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
