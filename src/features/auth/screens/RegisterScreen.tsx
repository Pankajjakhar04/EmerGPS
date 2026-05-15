// Register Screen — name + email entry for first-time users
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import type { AuthScreenProps } from '@/types/navigation';

export default function RegisterScreen({
  navigation,
  route,
}: AuthScreenProps<'Register'>) {
  const { signIn, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(route.params?.email ?? '');

  const handleRegister = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    const { error } = await signIn(trimmedEmail);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      navigation.navigate('VerifyOTP', { email: trimmedEmail });
    }
  }, [name, email, signIn, navigation]);

  return (
    <View className="flex-1 bg-dark-900">
      <StatusBar barStyle="light-content" backgroundColor="#101113" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-8"
      >
        {/* Header */}
        <View className="mb-10">
          <Text className="text-white text-3xl font-bold">Create Account</Text>
          <Text className="text-dark-100 text-base mt-2">
            Set up your emergency profile
          </Text>
        </View>

        {/* Name Input */}
        <View className="mb-5">
          <Text className="text-dark-50 text-sm font-semibold mb-2 uppercase tracking-wider">
            Full Name
          </Text>
          <TextInput
            className="bg-dark-600 text-white text-lg px-5 py-4 rounded-2xl border border-dark-400"
            placeholder="Your full name"
            placeholderTextColor="#5C5F66"
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
          />
        </View>

        {/* Email Input */}
        <View className="mb-6">
          <Text className="text-dark-50 text-sm font-semibold mb-2 uppercase tracking-wider">
            Email Address
          </Text>
          <TextInput
            className="bg-dark-600 text-white text-lg px-5 py-4 rounded-2xl border border-dark-400"
            placeholder="you@example.com"
            placeholderTextColor="#5C5F66"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center justify-center ${
            isLoading ? 'bg-safe-800' : 'bg-safe-600'
          }`}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white text-lg font-bold">
              Create & Verify
            </Text>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-tracking-400 text-sm">
            Already have an account? <Text className="font-bold">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}
