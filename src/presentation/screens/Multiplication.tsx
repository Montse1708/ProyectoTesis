import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:3000';
const OP = 'mul'; // <-- Ajusta si tu backend espera 'multiply' u otro

type Problem = {
  id?: string;
  a: number;
  b: number;
  questionText?: string;
  solution?: number;
};

export const Multiplication = () => {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const lastGradedProblemId = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const start = async () => {
    try {
      setLoading(true);
      setFeedback('');
      setProblem(null);
      setAnswer('');
      const s = await axios.post(`${API_URL}/session/start`, { op: OP });
      const sid = s.data?.sessionId;
      if (!sid) throw new Error('No sessionId from server');
      setSessionId(sid);

      const n = await axios.post(`${API_URL}/session/next`, { sessionId: sid, op: OP, locale: 'es' });
      const p = n.data?.problem;
      if (!p) throw new Error('No problem from server');
      setProblem(p);
    } catch (e: any) {
      Alert.alert('Error', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const fetchNext = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const n = await axios.post(`${API_URL}/session/next`, { sessionId, op: OP, locale: 'es' });
      const p = n.data?.problem;
      if (!p) throw new Error('No problem from server');
      setProblem(p);
      setAnswer('');
      setFeedback('');
      lastGradedProblemId.current = null;
    } catch (e: any) {
      Alert.alert('Error', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const parseNumber = (txt: string) => {
    const cleaned = txt.replace(',', '.').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '+') return NaN;
    return Number(cleaned);
  };

  const grade = async () => {
    if (!problem || !sessionId) return;
    if (grading) return;
    const num = parseNumber(answer);
    if (!isFinite(num)) return;
    if (lastGradedProblemId.current === problem.id) return;

    try {
      setGrading(true);
      const res = await axios.post(`${API_URL}/session/grade`, {
        sessionId,
        userAnswer: num,
        locale: 'es',
      });
      const data = res.data;
      setFeedback(data.correct ? `✅ CORRECTO. ${data.feedback ?? ''}` : `❌ INCORRECTO. ${data.feedback ?? ''}`);

      setTimeout(() => {
        fetchNext();
      }, 1000);

      lastGradedProblemId.current = problem.id || 'unknown';
    } catch (e: any) {
      Alert.alert('Error corrigiendo', String(e?.message || e));
    } finally {
      setGrading(false);
    }
  };

  useEffect(() => {
    start();
  }, []);

  useEffect(() => {
    if (!problem) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (answer.trim() !== '') {
      debounceTimer.current = setTimeout(() => {
        grade();
      }, 600);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, problem?.id]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multiplicación</Text>

      {(loading || grading) && <ActivityIndicator style={{ marginTop: 8 }} />}

      {problem ? (
        <View style={styles.card}>
          <Text style={styles.question}>
            {problem.questionText ?? `¿Cuánto es ${problem.a} × ${problem.b}?`}
          </Text>

          <TextInput
            style={styles.input}
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
            placeholder="Escribe tu respuesta…"
            value={answer}
            onChangeText={setAnswer}
            onSubmitEditing={grade}
            blurOnSubmit
          />

          {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
        </View>
      ) : (
        <Text style={{ marginTop: 8 }}>Cargando problema...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 12 },
  question: { fontSize: 18, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff', marginBottom: 10 },
  feedback: { marginTop: 8, fontSize: 16, fontWeight: '600' },
});