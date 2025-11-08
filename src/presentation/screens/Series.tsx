import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import axios from 'axios';

const DEFAULT_API =
  Platform.OS === 'ios'
    ? 'http://localhost:3000'
    : 'http://10.0.2.2:3000';

type ApiState = {
  op?: string;
  level?: number;
  streak?: number;
  correct?: number;
  wrong?: number;
};

type Problem = {
  id?: string;
  questionText?: string;
  solution?: number;
  meta?: {
    seqType?: 'arith' | 'geom';
    task?: 'next' | 'sum';
    a1?: number; d?: number; r?: number; n?: number; visibleTerms?: number;
  };
};

export const Series = () => {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [serverState, setServerState] = useState<ApiState | null>(null);

  const lastGradedProblemId = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = async () => {
    try {
      setLoading(true);
      setFeedback('');
      setProblem(null);
      setAnswer('');

      const s = await axios.post(`${DEFAULT_API}/session/start`, { op: 'seq', locale: 'es' });
      const sid = s.data?.sessionId;
      if (!sid) throw new Error('No sessionId from server');
      setSessionId(sid);

      const n = await axios.post(`${DEFAULT_API}/session/next`, { sessionId: sid, op: 'seq', locale: 'es' });
      const p = n.data?.problem;
      if (!p) throw new Error('No problem from server');
      setProblem(p);
      setServerState(n.data?.state ?? null); // ← nivel/racha aquí
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
      const n = await axios.post(`${DEFAULT_API}/session/next`, { sessionId, op: 'seq', locale: 'es' });
      const p = n.data?.problem;
      if (!p) throw new Error('No problem from server');
      setProblem(p);
      setServerState(n.data?.state ?? null); // ← actualizar nivel/racha
      setAnswer('');
      setFeedback('');
      lastGradedProblemId.current = null;
    } catch (e: any) {
      Alert.alert('Error', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const grade = async () => {
    if (!problem || !sessionId || grading) return;
    if ((answer ?? '').trim() === '') return;
    if (lastGradedProblemId.current === problem.id) return;

    try {
      setGrading(true);
      const res = await axios.post(`${DEFAULT_API}/session/grade`, {
        sessionId,
        userAnswer: Number(answer),
        locale: 'es',
      });
      const data = res.data;

      setServerState(data?.state ?? null); // ← nivel/racha después de calificar

      if (data.correct) setFeedback(`✅ CORRECTO. ${data.feedback ?? ''}`);
      else setFeedback(`❌ INCORRECTO. ${data.feedback ?? ''}`);

      lastGradedProblemId.current = problem.id || 'unknown';
      setTimeout(fetchNext, 1000);
    } catch (e: any) {
      Alert.alert('Error corrigiendo', String(e?.message || e));
    } finally {
      setGrading(false);
    }
  };

  useEffect(() => { start(); }, []);

  useEffect(() => {
    if (!problem) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (answer.trim() !== '') {
      debounceTimer.current = setTimeout(grade, 600);
    }
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [answer, problem?.id]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Series (Aritmética / Geométrica)</Text>

      {!!serverState && (
        <Text style={styles.stateText}>
          Nivel: {serverState.level ?? '—'} | Racha: {serverState.streak ?? 0}
        </Text>
      )}

      {(loading || grading) && <ActivityIndicator style={{ marginTop: 8 }} />}

      {problem ? (
        <View style={styles.card}>
          <Text style={styles.question}>
            {problem.questionText ?? 'Completa la secuencia.'}
          </Text>

          <TextInput
            style={styles.input}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            placeholder="Escribe tu respuesta… (entero)"
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
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  stateText: { fontSize: 12, color: '#666', marginBottom: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 8 },
  question: { fontSize: 18, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff', marginBottom: 10 },
  feedback: { marginTop: 8, fontSize: 16, fontWeight: '600' }
});