import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const BASE_URL = 'https://ai-fake-news-detector01.vercel.app';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setUser, checkSession } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      // Fetch CSRF token
      const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
      const { csrfToken } = await csrfRes.json();

      // Login
      const body = new URLSearchParams({ email, password, csrfToken, redirect: 'false', json: 'true' });
      const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        credentials: 'include',
      });

      // Get session
      const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, { credentials: 'include' });
      const session = await sessionRes.json();

      if (session?.user) {
        setUser(session.user);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', 'Invalid email or password.');
      }
    } catch (e) {
      Alert.alert('Error', 'Connection failed. Check your internet.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    Linking.openURL(`${BASE_URL}/api/auth/signin/google?callbackUrl=${BASE_URL}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="bar-chart" size={48} color={Colors.primary} />
        <Text style={styles.title}>AI Fake News Detector</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      {/* Google Button */}
      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
        <Ionicons name="logo-google" size={20} color="#fff" />
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Email */}
      <View style={styles.inputWrapper}>
        <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
        />
        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
          <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginText}>Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Signup link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { color: Colors.text, fontSize: 24, fontWeight: '700', marginTop: Spacing.md },
  subtitle: { color: Colors.textSecondary, fontSize: 15, marginTop: Spacing.xs },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#4285F4', borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  googleText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, marginHorizontal: Spacing.md, fontSize: 13 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  inputIcon: { padding: Spacing.md },
  input: { flex: 1, color: Colors.text, fontSize: 15, paddingVertical: Spacing.md, paddingRight: Spacing.md },
  eyeIcon: { padding: Spacing.md },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  loginText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  footerLink: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
