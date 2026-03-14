import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { fetchLiveNews, analyzeUrl } from '../../services/api';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function LiveScreen() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);

  const load = async () => {
    try {
      const data = await fetchLiveNews();
      setArticles(data?.articles || data || []);
    } catch { setArticles([]); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const handleAnalyze = async (article) => {
    setAnalyzing(article.url);
    try {
      const result = await analyzeUrl(article.url);
      router.push({ pathname: '/result', params: { data: JSON.stringify(result) } });
    } catch {
      // fallback: open in browser
      Linking.openURL(article.url);
    }
    setAnalyzing(null);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardSource}>{item.source?.name || 'Unknown source'}</Text>
        <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
        {item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={() => handleAnalyze(item)}
            disabled={analyzing === item.url}
          >
            {analyzing === item.url ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={14} color="#fff" />
                <Text style={styles.analyzeBtnText}>Analyze</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.readBtn} onPress={() => Linking.openURL(item.url)}>
            <Ionicons name="open-outline" size={14} color={Colors.primary} />
            <Text style={styles.readBtnText}>Read</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading live news...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="radio" size={22} color={Colors.danger} />
          <View style={styles.liveDot} />
          <Text style={styles.title}>Live News Feed</Text>
        </View>
        <TouchableOpacity onPress={() => { setRefreshing(true); load(); }}>
          <Ionicons name="refresh" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={articles}
        keyExtractor={(item, i) => item.url || i.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="radio-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No articles available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.textSecondary, marginTop: Spacing.md },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, paddingTop: Spacing.xl + Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  card: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
  cardContent: { padding: Spacing.md },
  cardSource: { color: Colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cardTitle: { color: Colors.text, fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 6 },
  cardDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: Spacing.md },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, minWidth: 90, justifyContent: 'center',
  },
  analyzeBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  readBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
  },
  readBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: Spacing.xl * 2 },
  emptyText: { color: Colors.textMuted, fontSize: 16, marginTop: Spacing.md },
});
