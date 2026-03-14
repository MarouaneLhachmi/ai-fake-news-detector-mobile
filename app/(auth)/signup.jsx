import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signupUser } from '../../services/api';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signupUser(name, email, password);
      Alert.alert('Success!', 'Account created. Please sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Signup failed.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Ionicons name="person-add" size={48} color={Colors.primary} />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join AI Fake News Detector</Text>
      </View>

      {[
        { label: 'Full Name', value: name, setter: setName, icon: 'person-outline', type: 'default' },
        { label: 'Email', value: email, setter: setEmail, icon: 'mail-outline', type: 'email-address' },
        { label: 'Password', value: password, setter: setPassword, icon: 'lock-closed-outline', type: 'default', secure: true },
      ].map(({ label, value, setter, icon, type, secure }) => (
        <View key={label} style={styles.inputWrapper}>
          <Ionicons name={icon} size={20} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={label}
            placeholderTextColor={Colors.textMuted}
            value={value}
            onChangeText={setter}
            keyboardType={type}
            autoCapitalize="none"
            secureTextEntry={secure}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.footerLink}>Sign In</Text>
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
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  inputIcon: { padding: Spacing.md },
  input: { flex: 1, color: Colors.text, fontSize: 15, paddingVertical: Spacing.md, paddingRight: Spacing.md },
  btn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  footerLink: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
