import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const BASE_URL = 'https://ai-fake-news-detector01.vercel.app';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { user, setUser } = useAuth();

  // Navigate to tabs only after user state is fully updated (avoids race condition crash)
  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Deep link that Chrome Custom Tab will redirect back to after OAuth
      const redirectUri = Linking.createURL('/');
      const callbackUrl = encodeURIComponent(redirectUri);
      const googleOAuthUrl = `${BASE_URL}/api/auth/signin/google?callbackUrl=${callbackUrl}`;

      // openAuthSessionAsync closes the browser automatically when it detects the deep link
      const result = await WebBrowser.openAuthSessionAsync(googleOAuthUrl, redirectUri);

      if (result.type === 'success') {
        // Browser was dismissed after redirect to our deep link — check session
        const res = await fetch(`${BASE_URL}/api/auth/session`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });
        const session = await res.json().catch(() => null);
        if (session?.user) {
          await setUser(session.user);
          // useEffect above handles navigation
        } else {
          Alert.alert(
            'Google sign-in incomplete',
            'The session could not be verified. Please ask the admin to whitelist "aifakenewsdetector://" in the backend NextAuth config, or use Email/Password login.'
          );
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User closed the browser — check if they completed login anyway
        const res = await fetch(`${BASE_URL}/api/auth/session`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        }).catch(() => null);
        const session = res?.ok ? await res.json().catch(() => null) : null;
        if (session?.user) {
          await setUser(session.user);
        }
      }
    } catch {
      Alert.alert('Error', 'Could not open Google sign-in.');
    }
    setGoogleLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
      const { csrfToken } = await csrfRes.json();

      const body = new URLSearchParams({
        email, password, csrfToken, redirect: 'false', json: 'true',
      });

      await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        credentials: 'include',
      });

      const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      const session = await sessionRes.json().catch(() => null);

      if (session?.user) {
        await setUser(session.user);
        // useEffect above handles navigation — no router.replace here (avoids race condition)
      } else {
        Alert.alert('Login Failed', 'Invalid email or password.');
      }
    } catch {
      Alert.alert('Error', 'Connection failed. Check your internet.');
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Ionicons name="bar-chart" size={48} color={Colors.primary} />
        <Text style={styles.title}>AI Fake News Detector</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      {/* Google Button */}
      <TouchableOpacity
        style={[styles.googleBtn, (googleLoading || loading) && { opacity: 0.7 }]}
        onPress={handleGoogleLogin}
        disabled={googleLoading || loading}
      >
        {googleLoading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Ionicons name="logo-google" size={20} color="#fff" />
        }
        <Text style={styles.googleText}>
          {googleLoading ? 'Opening browser...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

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

      <TouchableOpacity
        style={[styles.loginBtn, (loading || googleLoading) && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading || googleLoading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.loginText}>Sign In</Text>
        }
      </TouchableOpacity>

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
