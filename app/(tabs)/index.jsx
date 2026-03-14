import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { analyzeImage, analyzeImageUrl, analyzeText, analyzeUrl } from '../../services/api';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const TABS = [
  { key: 'image', label: 'Upload', icon: 'image-outline' },
  { key: 'imageUrl', label: 'Image URL', icon: 'link-outline' },
  { key: 'articleUrl', label: 'Article URL', icon: 'newspaper-outline' },
  { key: 'text', label: 'Text', icon: 'text-outline' },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('image');
  const [imageUri, setImageUri] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      let result;
      if (activeTab === 'image') {
        if (!imageUri) { Alert.alert('Select an image first'); setLoading(false); return; }
        result = await analyzeImage(imageUri);
      } else if (activeTab === 'imageUrl') {
        if (!imageUrl) { Alert.alert('Enter an image URL'); setLoading(false); return; }
        result = await analyzeImageUrl(imageUrl);
      } else if (activeTab === 'articleUrl') {
        if (!articleUrl) { Alert.alert('Enter an article URL'); setLoading(false); return; }
        result = await analyzeUrl(articleUrl);
      } else {
        if (!text) { Alert.alert('Enter some text'); setLoading(false); return; }
        result = await analyzeText(text);
      }
      router.push({ pathname: '/result', params: { data: JSON.stringify(result) } });
    } catch (e) {
      Alert.alert('Analysis failed', e?.response?.data?.error || 'Please try again.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="bar-chart" size={28} color={Colors.primary} />
        <Text style={styles.title}>AI Fake News Detector</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? '#fff' : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content by tab */}
      <View style={styles.card}>
        {activeTab === 'image' && (
          <View>
            {imageUri ? (
              <View>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.changeBtn} onPress={() => setImageUri(null)}>
                  <Text style={styles.changeBtnText}>Change image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadZone}>
                <Ionicons name="cloud-upload-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.uploadText}>Select a news screenshot</Text>
                <View style={styles.uploadBtns}>
                  <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                    <Ionicons name="images-outline" size={18} color="#fff" />
                    <Text style={styles.uploadBtnText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: Colors.surfaceLight }]} onPress={takePhoto}>
                    <Ionicons name="camera-outline" size={18} color="#fff" />
                    <Text style={styles.uploadBtnText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'imageUrl' && (
          <View>
            <Text style={styles.inputLabel}>Image URL</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={Colors.textMuted}
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        )}

        {activeTab === 'articleUrl' && (
          <View>
            <Text style={styles.inputLabel}>Article URL</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://news-site.com/article"
              placeholderTextColor={Colors.textMuted}
              value={articleUrl}
              onChangeText={setArticleUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        )}

        {activeTab === 'text' && (
          <View>
            <Text style={styles.inputLabel}>Paste article text</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Paste the news article content here..."
              placeholderTextColor={Colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        )}
      </View>

      {/* Analyze Button */}
      <TouchableOpacity
        style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
        onPress={handleAnalyze}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.analyzeBtnContent}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.analyzeBtnText}>Analyzing...</Text>
          </View>
        ) : (
          <View style={styles.analyzeBtnContent}>
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.analyzeBtnText}>Analyze Now</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* How it works */}
      <View style={styles.howItWorks}>
        <Text style={styles.sectionTitle}>How it works</Text>
        {[
          { step: '1', text: 'Upload a news image, URL, or paste text', icon: 'cloud-upload-outline' },
          { step: '2', text: 'AI analyzes for fake news indicators', icon: 'sparkles-outline' },
          { step: '3', text: 'Get a detailed credibility report', icon: 'checkmark-circle-outline' },
        ].map(({ step, text, icon }) => (
          <View key={step} style={styles.howStep}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>{step}</Text>
            </View>
            <Ionicons name={icon} size={22} color={Colors.primary} style={{ marginHorizontal: Spacing.sm }} />
            <Text style={styles.stepText}>{text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg, marginTop: Spacing.xl },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  tabsScroll: { marginBottom: Spacing.md },
  tabs: { flexDirection: 'row', gap: Spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceLight,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  card: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md,
  },
  uploadZone: { alignItems: 'center', paddingVertical: Spacing.xl },
  uploadText: { color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.lg, fontSize: 15 },
  uploadBtns: { flexDirection: 'row', gap: Spacing.md },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
  },
  uploadBtnText: { color: '#fff', fontWeight: '600' },
  previewImage: { width: '100%', height: 200, borderRadius: BorderRadius.md, resizeMode: 'cover' },
  changeBtn: { alignItems: 'center', marginTop: Spacing.sm },
  changeBtnText: { color: Colors.primary, fontSize: 14 },
  inputLabel: { color: Colors.textSecondary, fontSize: 13, marginBottom: Spacing.sm },
  textInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, color: Colors.text,
    padding: Spacing.md, fontSize: 14,
  },
  textArea: { minHeight: 160 },
  analyzeBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  howItWorks: { marginTop: Spacing.md },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '600', marginBottom: Spacing.md },
  howStep: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepText: { color: Colors.textSecondary, flex: 1, fontSize: 14 },
});
