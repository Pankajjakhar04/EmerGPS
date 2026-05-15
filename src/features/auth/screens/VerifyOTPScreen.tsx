// OTP Verification Screen
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import type { AuthScreenProps } from '@/types/navigation';

const OTP_LENGTH = 6;

export default function VerifyOTPScreen({
  route,
}: AuthScreenProps<'VerifyOTP'>) {
  const { email } = route.params;
  const { verifyOTP, signIn, isLoading } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const handleOtpChange = useCallback(
    (value: string, index: number) => {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-advance to next input
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all digits entered
      if (newOtp.every((d) => d.length === 1)) {
        handleVerify(newOtp.join(''));
      }
    },
    [handleVerify, otp],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const handleVerify = useCallback(
    async (code?: string) => {
      const otpCode = code || otp.join('');
      if (otpCode.length !== OTP_LENGTH) {
        Alert.alert('Invalid Code', 'Please enter the full verification code.');
        return;
      }

      const { error } = await verifyOTP(email, otpCode);
      if (error) {
        Alert.alert('Verification Failed', error.message);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
      // Success: auth state listener will navigate to main app
    },
    [otp, email, verifyOTP],
  );

  const handleResend = useCallback(async () => {
    const { error } = await signIn(email);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setCountdown(60);
      Alert.alert('Code Sent', 'A new verification code has been sent.');
    }
  }, [email, signIn]);

  return (
    <View className="flex-1 bg-dark-900">
      <StatusBar barStyle="light-content" backgroundColor="#101113" />
      <View className="flex-1 justify-center px-8">
        {/* Header */}
        <View className="mb-10">
          <Text className="text-white text-3xl font-bold">Verify Email</Text>
          <Text className="text-dark-100 text-base mt-2">
            Enter the 6-digit code sent to
          </Text>
          <Text className="text-tracking-400 text-base font-semibold mt-1">
            {email}
          </Text>
        </View>

        {/* OTP Input Grid */}
        <View className="flex-row justify-between mb-8">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              className={`w-14 h-16 bg-dark-600 rounded-2xl text-center text-white text-2xl font-bold border ${
                digit ? 'border-tracking-500' : 'border-dark-400'
              }`}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              editable={!isLoading}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center justify-center ${
            isLoading ? 'bg-tracking-800' : 'bg-tracking-600'
          }`}
          onPress={() => handleVerify()}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white text-lg font-bold">Verify Code</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View className="mt-6 items-center">
          {countdown > 0 ? (
            <Text className="text-dark-200 text-sm">
              Resend code in{' '}
              <Text className="text-tracking-400 font-bold">{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text className="text-tracking-400 text-sm font-bold">
                Resend Code
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
