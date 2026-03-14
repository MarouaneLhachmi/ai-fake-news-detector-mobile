import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateQuiz, saveQuizScore } from '../../services/api';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function QuizScreen() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const data = await generateQuiz();
      const q = data?.questions || data || [];
      if (!q.length) { Alert.alert('No questions available', 'Try again later.'); setLoading(false); return; }
      setQuestions(q);
      setCurrent(0);
      setScore(0);
      setSelected(null);
      setFinished(false);
      setStarted(true);
    } catch {
      Alert.alert('Error', 'Could not load quiz. Try again.');
    }
    setLoading(false);
  };

  const handleAnswer = (answer) => {
    if (selected !== null) return;
    setSelected(answer);
    const q = questions[current];
    const correct = q.correctAnswer ?? q.answer;
    if (answer === correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      saveQuizScore(score + (selected === (questions[current].correctAnswer ?? questions[current].answer) ? 0 : 0), questions.length).catch(() => {});
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  const getOptionStyle = (option) => {
    if (selected === null) return styles.option;
    const correct = questions[current].correctAnswer ?? questions[current].answer;
    if (option === correct) return [styles.option, styles.optionCorrect];
    if (option === selected && option !== correct) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDimmed];
  };

  // Start screen
  if (!started) {
    return (
      <View style={styles.center}>
        <Ionicons name="help-circle" size={72} color={Colors.primary} />
        <Text style={styles.startTitle}>News Quiz</Text>
        <Text style={styles.startSubtitle}>Test your ability to spot fake news with AI-generated questions</Text>
        <TouchableOpacity style={styles.startBtn} onPress={startQuiz} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <><Ionicons name="play" size={20} color="#fff" /><Text style={styles.startBtnText}>Start Quiz</Text></>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Results screen
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <View style={styles.center}>
        <Ionicons name="trophy" size={72} color={Colors.warning} />
        <Text style={styles.startTitle}>Quiz Completed!</Text>
        <Text style={styles.scoreText}>{score} / {questions.length}</Text>
        <Text style={[styles.startSubtitle, { color: pct >= 70 ? Colors.success : Colors.danger }]}>
          {pct >= 70 ? 'Great job! You have a good eye for fake news.' : 'Keep practicing to improve!'}
        </Text>
        <TouchableOpacity style={styles.startBtn} onPress={startQuiz}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.startBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Quiz screen
  const q = questions[current];
  const options = q?.options || q?.choices || [];
  const correct = q?.correctAnswer ?? q?.answer;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>Question {current + 1} / {questions.length}</Text>
        <Text style={styles.scoreLabel}>Score: {score}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q?.question || q?.headline}</Text>
        {q?.context && <Text style={styles.contextText}>{q.context}</Text>}
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, i) => {
          const isCorrect = option === correct;
          const isSelected = selected === option;
          return (
            <TouchableOpacity key={i} style={getOptionStyle(option)} onPress={() => handleAnswer(option)}>
              <View style={styles.optionInner}>
                {selected !== null && (
                  <Ionicons
                    name={isCorrect ? 'checkmark-circle' : isSelected ? 'close-circle' : 'ellipse-outline'}
                    size={20}
                    color={isCorrect ? Colors.success : isSelected ? Colors.danger : Colors.textMuted}
                  />
                )}
                <Text style={styles.optionText}>{option}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Explanation */}
      {selected !== null && q?.explanation && (
        <View style={styles.explanationCard}>
          <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
          <Text style={styles.explanationText}>{q.explanation}</Text>
        </View>
      )}

      {/* Next */}
      {selected !== null && (
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {current + 1 >= questions.length ? 'See Results' : 'Next Question'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: Spacing.xl + Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  startTitle: { color: Colors.text, fontSize: 26, fontWeight: '700', marginTop: Spacing.md, textAlign: 'center' },
  startSubtitle: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', marginVertical: Spacing.md, lineHeight: 22 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.full, marginTop: Spacing.md,
  },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  scoreText: { color: Colors.primary, fontSize: 48, fontWeight: '700', marginVertical: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressText: { color: Colors.textSecondary, fontSize: 13 },
  scoreLabel: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3, marginBottom: Spacing.lg, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  questionCard: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  questionText: { color: Colors.text, fontSize: 16, fontWeight: '600', lineHeight: 24 },
  contextText: { color: Colors.textSecondary, fontSize: 13, marginTop: Spacing.sm, lineHeight: 20 },
  optionsContainer: { gap: Spacing.sm, marginBottom: Spacing.md },
  option: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  optionCorrect: { borderColor: Colors.success, backgroundColor: 'rgba(34,197,94,0.1)' },
  optionWrong: { borderColor: Colors.danger, backgroundColor: 'rgba(239,68,68,0.1)' },
  optionDimmed: { opacity: 0.4 },
  optionInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionText: { color: Colors.text, fontSize: 14, flex: 1 },
  explanationCard: {
    flexDirection: 'row', gap: 10, backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.warning,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  explanationText: { color: Colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 20 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
