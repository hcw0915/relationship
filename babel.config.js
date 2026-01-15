module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 必須放最後：https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/#babel-plugin
      'react-native-reanimated/plugin',
    ],
  };
};
