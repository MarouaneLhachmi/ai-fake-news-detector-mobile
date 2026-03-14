import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sendFeedback } from '../services/api';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

export default function ResultScreen() {
  const { data } = useLocalSearchParams();
  const result = JSON.parse(data || '{}');

  const isFake = result.isLikelyFake;
  const confidence = result.confidenceScore ?? result.confidence ?? 0;

  const handleFeedback = async (type) => {
    try {
      if (result.id) await sendFeedback(result.id, type);
      Alert.alert('Thank you!', 'Your feedback has been recorded.');
    } catch {}
  };

  const getConfidenceColor = (c) => {
    if (c >= 70) return isFake ? Colors.danger : Colors.success;
    return Colors.warning;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>New Analysis</Text>
      </TouchableOpacity>

      {/* Verdict */}
      <View style={[styles.verdictCard, { borderColor: isFake ? Colors.danger : Colors.success }]}>
        <Ionicons
          name={isFake ? 'close-circle' : 'checkmark-circle'}
          size={56}
          color={isFake ? Colors.danger : Colors.success}
        />
        <Text style={[styles.verdictText, { color: isFake ? Colors.danger : Colors.success }]}>
          {isFake ? 'Likely Fake News' : 'Likely Real News'}
        </Text>

        {/* Confidence gauge */}
        <View style={styles.gaugeContainer}>
          <Text style={styles.gaugeLabel}>Confidence: {confidence}%</Text>
          <View style={styles.gaugeBar}>
            <View style={[styles.gaugeFill, {
              width: `${confidence}%`,
              backgroundColor: getConfidenceColor(confidence),
            }]} />
          </View>
        </View>
      </View>

      {/* Analysis */}
      {result.analysis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis</Text>
          <Text style={styles.analysisText}>{result.analysis}</Text>
        </View>
      )}

      {/* Tags row */}
      <View style={styles.tagsRow}>
        {result.bias && <Tag label={`Bias: ${result.bias}`} color={Colors.primary} />}
        {result.tone && <Tag label={`Tone: ${result.tone}`} color={Colors.warning} />}
        {result.sensationalism && <Tag label={`Sensationalism: ${result.sensationalism}`} color={Colors.danger} />}
      </View>

      {/* Main Claims */}
      {result.mainClaims?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Claims</Text>
          {result.mainClaims.map((claim, i) => (
            <View key={i} style={styles.listItem}>
              <Ionicons name="ellipse" size={8} color={Colors.primary} style={{ marginTop: 6 }} />
              <Text style={styles.listText}>{claim}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Logical Fallacies */}
      {result.logicalFallacies?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logical Fallacies</Text>
          {result.logicalFallacies.map((f, i) => (
            <View key={i} style={styles.listItem}>
              <Ionicons name="warning-outline" size={14} color={Colors.warning} style={{ marginTop: 3 }} />
              <Text style={styles.listText}>{f}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sources */}
      {result.sources?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Sources</Text>
          {result.sources.map((s, i) => (
            <View key={i} style={styles.sourceItem}>
              <Ionicons name="link-outline" size={14} color={Colors.primary} />
              <Text style={styles.sourceText} numberOfLines={2}>{s.title || s.url}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Was this analysis helpful?</Text>
        <View style={styles.feedbackRow}>
          <TouchableOpacity style={styles.feedbackBtn} onPress={() => handleFeedback('helpful')}>
            <Ionicons name="thumbs-up-outline" size={22} color={Colors.success} />
            <Text style={[styles.feedbackText, { color: Colors.success }]}>Helpful</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedbackBtn} onPress={() => handleFeedback('not_helpful')}>
            <Ionicons name="thumbs-down-outline" size={22} color={Colors.danger} />
            <Text style={[styles.feedbackText, { color: Colors.danger }]}>Not helpful</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function Tag({ label, color }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, paddingTop: Spacing.xl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg },
  backText: { color: Colors.text, fontSize: 15 },
  verdictCard: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg,
    borderWidth: 2, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg,
  },
  verdictText: { fontSize: 22, fontWeight: '700', marginTop: Spacing.sm, marginBottom: Spacing.lg },
  gaugeContainer: { width: '100%' },
  gaugeLabel: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, textAlign: 'center' },
  gaugeBar: { height: 10, backgroundColor: Colors.surface, borderRadius: 5, overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: 5 },
  section: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md,
  },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '600', marginBottom: Spacing.sm },
  analysisText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  tag: { borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '600' },
  listItem: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  listText: { color: Colors.textSecondary, flex: 1, fontSize: 14, lineHeight: 20 },
  sourceItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  sourceText: { color: Colors.primary, flex: 1, fontSize: 13 },
  feedbackRow: { flexDirection: 'row', gap: Spacing.md },
  feedbackBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  feedbackText: { fontWeight: '600', fontSize: 14 },
});
