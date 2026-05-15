// Emergency HELP Slider — the most important UI component
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Vibration, Dimensions } from 'react-native';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_PADDING = 48; // px-6 * 2
const SLIDER_WIDTH = SCREEN_WIDTH - SLIDER_PADDING;
const THUMB_SIZE = 64;
const TRACK_HEIGHT = 72;
const ACTIVATION_THRESHOLD = SLIDER_WIDTH - THUMB_SIZE - 16;

interface HelpSliderProps {
  onActivated: () => void;
  disabled?: boolean;
}

export default function HelpSlider({ onActivated, disabled }: HelpSliderProps) {
  const translateX = useSharedValue(0);
  const [activated, setActivated] = useState(false);
  const pulseScale = useSharedValue(1);

  // Pulse animation when activated
  useEffect(() => {
    if (activated) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [activated, pulseScale]);

  const triggerActivation = useCallback(() => {
    setActivated(true);
    // Strong vibration pattern for emergency
    Vibration.vibrate([0, 200, 100, 200, 100, 500], false);
    onActivated();
  }, [onActivated]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled && !activated)
    .onUpdate((event) => {
      const x = Math.max(0, Math.min(event.translationX, ACTIVATION_THRESHOLD));
      translateX.value = x;
    })
    .onEnd(() => {
      if (translateX.value >= ACTIVATION_THRESHOLD * 0.85) {
        translateX.value = withSpring(ACTIVATION_THRESHOLD);
        runOnJS(triggerActivation)();
      } else {
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => {
    const progress = translateX.value / ACTIVATION_THRESHOLD;
    const bgColor = interpolateColor(
      progress,
      [0, 0.5, 1],
      ['rgba(250, 82, 82, 0.15)', 'rgba(250, 82, 82, 0.4)', 'rgba(250, 82, 82, 0.7)'],
    );
    return { backgroundColor: bgColor };
  });

  const textOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, ACTIVATION_THRESHOLD * 0.5], [1, 0]),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (activated) {
    return (
      <Animated.View
        style={containerStyle}
        className="rounded-2xl overflow-hidden"
      >
        <View className="bg-emergency-700 py-5 px-6 rounded-2xl border-2 border-emergency-500 items-center">
          <Text className="text-white text-xl font-bold">
            🚨 EMERGENCY ACTIVE
          </Text>
          <Text className="text-emergency-100 text-sm mt-2 text-center">
            Continuous live tracking enabled.{'\n'}All viewers are being alerted.
          </Text>
          <View className="mt-4 bg-white/20 py-3 px-6 rounded-xl">
            <Text className="text-white font-bold text-center">
              Tap to deactivate
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={trackStyle}
        className="rounded-2xl border-2 border-emergency-700 overflow-hidden"
      >
        <View
          style={{ height: TRACK_HEIGHT }}
          className="flex-row items-center px-2 relative"
        >
          {/* Slide text */}
          <Animated.View
            style={textOpacity}
            className="absolute inset-0 items-center justify-center"
          >
            <Text className="text-emergency-300 text-base font-bold tracking-wide">
              SLIDE FOR EMERGENCY →
            </Text>
          </Animated.View>

          {/* Thumb */}
          <Animated.View
            style={[
              thumbStyle,
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
              },
            ]}
            className="bg-emergency-600 rounded-xl items-center justify-center shadow-lg z-10"
          >
            <Text className="text-white text-2xl">🆘</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
