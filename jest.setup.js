require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => {
  const Animated = {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    createAnimatedComponent: (component) => component,
  };

  return {
    __esModule: true,
    default: Animated,
    View: Animated.View,
    Text: Animated.Text,
    Image: Animated.Image,
    createAnimatedComponent: (component) => component,
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (factory) => factory(),
    withSpring: (value) => value,
    withTiming: (value) => value,
    withRepeat: (animation) => animation,
    withSequence: (...animations) => animations[0],
    runOnJS: (fn) => fn,
    interpolate: () => 0,
    interpolateColor: () => '#000000',
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
  })),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
  })),
}));

jest.mock('react-native-mmkv', () => {
  const store = {};

  return {
    createMMKV: jest.fn(() => ({
      getString: (key) => (key in store ? store[key] : null),
      set: (key, value) => {
        store[key] = value;
      },
      remove: (key) => {
        delete store[key];
      },
      getAllKeys: () => Object.keys(store),
    })),
  };
});

jest.mock('react-native-device-info', () => ({
  getBatteryLevel: jest.fn(async () => 1),
  isBatteryCharging: jest.fn(async () => true),
}));