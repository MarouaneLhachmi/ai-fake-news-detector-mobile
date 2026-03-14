import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { getHistory, clearHistory } from '../../services/api';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(Array.isArray(data) ? data.reverse() : []);
    } catch {
      setHistory([]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadHistory(); }, []));

  const handleClear = () => {
    Alert.alert('Clear History', 'Delete all your analyses?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isFake = item.result?.isLikelyFake;
    const confidence = item.result?.confidenceScore ?? item.result?.confidence ?? 0;
    const inputPreview = item.inputValue || item.url || item.text || 'Image analysis';
    const date = new Date(item.createdAt).toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push({ pathname: '/result', params: { data: JSON.stringify(item.result || item) } })}
      >
        <View style={styles.itemLeft}>
          <Ionicons
            name={isFake ? 'close-circle' : 'checkmark-circle'}
            size={32}
            color={isFake ? Colors.danger : Colors.success}
          />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemSource} numberOfLines={1}>
            {item.source === 'image' ? '📷 Image' : item.source === 'url' ? '🔗 URL' : '📝 Text'}
          </Text>
          <Text style={styles.itemPreview} numberOfLines={2}>{inputPreview}</Text>
          <View style={styles.itemMeta}>
            <Text style={[styles.itemVerdict, { color: isFake ? Colors.danger : Colors.success }]}>
              {isFake ? 'Fake' : 'Real'} · {confidence}%
            </Text>
            <Text style={styles.itemDate}>{date}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No analyses yet</Text>
          <Text style={styles.emptySubtext}>Your analysis history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: Spacing.md }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadHistory(); }}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, paddingTop: Spacing.xl + Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  itemLeft: { marginRight: Spacing.md },
  itemContent: { flex: 1 },
  itemSource: { color: Colors.textMuted, fontSize: 12, marginBottom: 2 },
  itemPreview: { color: Colors.text, fontSize: 14, marginBottom: 4 },
  itemMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  itemVerdict: { fontSize: 12, fontWeight: '600' },
  itemDate: { color: Colors.textMuted, fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.text, fontSize: 18, fontWeight: '600', marginTop: Spacing.md },
  emptySubtext: { color: Colors.textMuted, fontSize: 14, marginTop: Spacing.sm, textAlign: 'center' },
});
