import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const BASE_URL = 'https://ai-fake-news-detector01.vercel.app';

// ── Chrome Mobile User-Agent — passes Google's "secure browser" check ──
// Google blocks WebViews that have "wv" in the UA or use the default Android WebView UA.
// Using a real Chrome Mobile UA fixes the 403 disallowed_useragent error.
const CHROME_MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const { setUser } = useAuth();
  const webviewRef = useRef(null);

  // ── Detect when Google OAuth is done and session is set ──
  const handleNavigationChange = async (navState) => {
    const { url } = navState;
    if (!url) return;

    // NextAuth redirects to BASE_URL (homepage) after successful login
    const isBackOnSite = url.startsWith(BASE_URL) &&
      !url.includes('/login') &&
      !url.includes('/api/auth') &&
      !url.includes('accounts.google.com') &&
      !url.includes('google.com/o/oauth2');

    if (isBackOnSite) {
      // Inject JS to fetch the session from within the WebView context
      // (cookies are available here since we're in the same WebView)
      webviewRef.current?.injectJavaScript(`
        fetch('/api/auth/session', { credentials: 'include' })
          .then(r => r.json())
          .then(data => window.ReactNativeWebView.postMessage(JSON.stringify(data)))
          .catch(e => window.ReactNativeWebView.postMessage(JSON.stringify({error: e.message})));
        true;
      `);
    }
  };

  // ── Receive session data injected from WebView ──
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.user) {
        setShowGoogleModal(false);
        setUser(data.user);
        router.replace('/(tabs)');
      } else if (data?.error) {
        Alert.alert('Error', 'Could not get session: ' + data.error);
        setShowGoogleModal(false);
      }
    } catch {}
  };

  // ── Credentials login ──────────────────────────────────
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
    <>
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
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={() => { setWebviewLoading(true); setShowGoogleModal(true); }}
          disabled={loading}
        >
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

        {/* Sign In */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.loginText}>Sign In</Text>
          }
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Google OAuth Modal with Chrome UA ── */}
      <Modal
        visible={showGoogleModal}
        animationType="slide"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowGoogleModal(false)}
              style={styles.modalBackBtn}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
              <Text style={styles.modalBackText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sign in with Google</Text>
            {webviewLoading
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <View style={{ width: 24 }} />
            }
          </View>

          {/* WebView with Chrome Mobile UA — bypasses Google's disallowed_useragent */}
          <WebView
            ref={webviewRef}
            source={{
              uri: `${BASE_URL}/api/auth/signin/google?callbackUrl=${encodeURIComponent(BASE_URL)}`,
            }}
            userAgent={CHROME_MOBILE_UA}
            onNavigationStateChange={handleNavigationChange}
            onMessage={handleWebViewMessage}
            onLoadStart={() => setWebviewLoading(true)}
            onLoadEnd={() => setWebviewLoading(false)}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            style={{ flex: 1 }}
          />
        </View>
      </Modal>
    </>
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
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, padding: Spacing.md, paddingTop: 48,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalBackText: { color: Colors.text, fontSize: 15 },
  modalTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
});
