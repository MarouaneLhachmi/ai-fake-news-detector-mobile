import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { updateProfile } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return; }
    setLoading(true);
    try {
      await updateProfile({ name });
      setUser({ ...user, name });
      setEditing(false);
      Alert.alert('Success', 'Profile updated!');
    } catch {
      Alert.alert('Error', 'Could not update profile.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const avatarUrl = user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=3b82f6&color=fff&size=128`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.isAdmin && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.adminText}>Admin</Text>
          </View>
        )}
      </View>

      {/* Edit profile */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons name={editing ? 'close' : 'pencil'} size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={Colors.textMuted}
            />
          ) : (
            <Text style={styles.fieldValue}>{user?.name}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{user?.email}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Login method</Text>
          <Text style={styles.fieldValue}>{user?.provider || 'credentials'}</Text>
        </View>

        {editing && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        )}
      </View>

      {/* Menu items */}
      <View style={styles.section}>
        {user?.isAdmin && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Admin', 'Admin dashboard is available on the web version.')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
            <Text style={styles.menuText}>Admin Dashboard</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/history')}>
          <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.menuText}>Analysis History</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/dashboard')}>
          <Ionicons name="bar-chart-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.menuText}>My Statistics</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>AI Fake News Detector v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: Colors.primary },
  userName: { color: Colors.text, fontSize: 22, fontWeight: '700', marginTop: Spacing.md },
  userEmail: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: BorderRadius.full, marginTop: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary,
  },
  adminText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  field: { marginBottom: Spacing.md },
  fieldLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 4 },
  fieldValue: { color: Colors.text, fontSize: 15 },
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border, color: Colors.text,
    padding: Spacing.sm, fontSize: 15,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuText: { color: Colors.text, flex: 1, fontSize: 15 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.danger, padding: Spacing.md, marginBottom: Spacing.md,
  },
  logoutText: { color: Colors.danger, fontWeight: '600', fontSize: 15 },
  version: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
});
