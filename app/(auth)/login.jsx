import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, AppState,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const BASE_URL = 'https://ai-fake-news-detector01.vercel.app';

// Required for expo-web-browser to handle the auth session
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setUser } = useAuth();

  const googlePending = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // Detect when user returns to the app after Google OAuth
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active' &&
        googlePending.current
      ) {
        googlePending.current = false;
        setGoogleLoading(true);
        try {
          const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
          });
          const session = await sessionRes.json();
          if (session?.user) {
            setUser(session.user);
            router.replace('/(tabs)');
          } else {
            Alert.alert(
              'Sign-in incomplete',
              'Please use Email/Password login, or try Google again.'
            );
          }
        } catch {
          Alert.alert('Error', 'Could not verify session. Try again.');
        }
        setGoogleLoading(false);
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  // Google OAuth via Chrome Custom Tab (accepted by Google, shares cookies)
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const callbackUrl = encodeURIComponent(BASE_URL);
      const googleOAuthUrl = `${BASE_URL}/api/auth/signin/google?callbackUrl=${callbackUrl}`;

      googlePending.current = true;

      // Opens Chrome Custom Tab on Android / SFSafariViewController on iOS
      // Google accepts these as "secure browsers" unlike plain WebView
      const result = await WebBrowser.openBrowserAsync(googleOAuthUrl, {
        showTitle: true,
        toolbarColor: '#0d1117',
        secondaryToolbarColor: '#3b82f6',
        enableBarCollapsing: false,
      });

      // If user dismissed the browser without completing login
      if (result.type === 'cancel' || result.type === 'dismiss') {
        googlePending.current = false;
        setGoogleLoading(false);
      }
      // If completed, AppState listener will handle the session check
    } catch (e) {
      googlePending.current = false;
      setGoogleLoading(false);
      Alert.alert('Error', 'Could not open Google sign-in.');
    }
  };

  // Credentials login
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
      const session = await sessionRes.json();

      if (session?.user) {
        setUser(session.user);
        router.replace('/(tabs)');
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

      {googleLoading && (
        <View style={styles.hintBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.hintText}>
            Complete sign-in in the browser, then return to this app.
          </Text>
        </View>
      )}

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
  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.primary,
    padding: Spacing.md, marginTop: Spacing.sm,
  },
  hintText: { color: Colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 18 },
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
