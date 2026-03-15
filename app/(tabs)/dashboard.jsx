import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardStats, getHistory } from '../../services/api';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../services/AuthContext';

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      // Fetch both stats AND history in parallel
      const [statsData, historyData] = await Promise.all([
        getDashboardStats(),
        getHistory(),
      ]);
      setStats(statsData);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // ── Bug fix 1: backend returns "authenticCount" not "realCount" ──
  const fakeCount = stats?.fakeCount ?? 0;
  const realCount = stats?.authenticCount ?? stats?.realCount ?? 0;
  const total = stats?.totalAnalyses ?? (fakeCount + realCount);
  const fakePercent = total > 0 ? Math.round((fakeCount / total) * 100) : 0;

  // ── Bug fix 2: compute type counts from history since backend doesn't return them ──
  const imageCount = history.filter(h =>
    h.inputType === 'image' || h.source === 'image'
  ).length;

  const urlCount = history.filter(h =>
    h.inputType === 'url' || h.source === 'url' ||
    h.source === 'article-url' || h.source === 'image-url'
  ).length;

  const textCount = history.filter(h =>
    h.inputType === 'text' || h.source === 'text'
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="bar-chart"
          label="Total Analyses"
          value={total}
          color={Colors.primary}
        />
        <StatCard
          icon="close-circle"
          label="Fake Detected"
          value={fakeCount}
          color={Colors.danger}
        />
        <StatCard
          icon="checkmark-circle"
          label="Real News"
          value={realCount}   // ✅ fixed: was stats?.realCount (undefined)
          color={Colors.success}
        />
        <StatCard
          icon="trophy"
          label="Quiz Score"
          value={stats?.bestQuizScore ?? 0}
          color={Colors.warning}
        />
      </View>

      {/* Fake/Real ratio bar */}
      {total > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fake vs Real ratio</Text>
          <View style={styles.ratioBar}>
            <View style={[styles.ratioFake, { flex: fakePercent || 1 }]} />
            <View style={[styles.ratioReal, { flex: (100 - fakePercent) || 1 }]} />
          </View>
          <View style={styles.ratioLabels}>
            <Text style={[styles.ratioLabel, { color: Colors.danger }]}>
              Fake {fakePercent}%
            </Text>
            <Text style={[styles.ratioLabel, { color: Colors.success }]}>
              Real {100 - fakePercent}%
            </Text>
          </View>
        </View>
      )}

      {/* Analysis by type — ✅ fixed: computed from history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis by type</Text>
        {[
          { label: 'Image analyses', value: imageCount, icon: 'image-outline', color: Colors.primary },
          { label: 'URL analyses',   value: urlCount,   icon: 'link-outline',  color: Colors.warning },
          { label: 'Text analyses',  value: textCount,  icon: 'text-outline',  color: Colors.success },
        ].map(({ label, value, icon, color }) => (
          <View key={label} style={styles.typeRow}>
            <Ionicons name={icon} size={18} color={color} />
            <Text style={styles.typeLabel}>{label}</Text>
            <View style={styles.typeBarContainer}>
              <View style={[styles.typeBar, {
                width: total > 0 ? `${Math.round((value / total) * 100)}%` : '0%',
                backgroundColor: color,
                minWidth: value > 0 ? 4 : 0,
              }]} />
            </View>
            <Text style={[styles.typeValue, { color }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Recent activity from history */}
      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          {history.slice(0, 5).map((item, i) => {
            const isFake = item.result?.isLikelyFake === true;
            const label = item.inputType === 'image'
              ? 'Image Analysis'
              : (item.inputValue || item.text || item.url || 'Analysis');
            const date = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : '';
            return (
              <View key={i} style={[
                styles.activityItem,
                i === history.slice(0, 5).length - 1 && { borderBottomWidth: 0 },
              ]}>
                <Ionicons
                  name={isFake ? 'close-circle' : 'checkmark-circle'}
                  size={18}
                  color={isFake ? Colors.danger : Colors.success}
                />
                <Text style={styles.activityText} numberOfLines={1}>
                  {label}
                </Text>
                <Text style={styles.activityDate}>{date}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { paddingTop: Spacing.xl, marginBottom: Spacing.lg },
  title: { color: Colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: 15, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  statValue: { color: Colors.text, fontSize: 28, fontWeight: '700' },
  statLabel: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center' },
  section: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md,
  },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '600', marginBottom: Spacing.md },
  ratioBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  ratioFake: { backgroundColor: Colors.danger },
  ratioReal: { backgroundColor: Colors.success },
  ratioLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  ratioLabel: { fontSize: 12, fontWeight: '600' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.sm },
  typeLabel: { color: Colors.textSecondary, fontSize: 13, width: 110 },
  typeBarContainer: { flex: 1, height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden' },
  typeBar: { height: '100%', borderRadius: 3 },
  typeValue: { fontSize: 13, fontWeight: '600', width: 24, textAlign: 'right' },
  activityItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  activityText: { color: Colors.textSecondary, flex: 1, fontSize: 13 },
  activityDate: { color: Colors.textMuted, fontSize: 11 },
});
