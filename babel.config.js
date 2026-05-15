module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@/config': './src/config',
          '@/features': './src/features',
          '@/components': './src/components',
          '@/hooks': './src/hooks',
          '@/services': './src/services',
          '@/types': './src/types',
          '@/utils': './src/utils',
          '@/navigation': './src/navigation',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
