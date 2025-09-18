import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

// Cambia esto según dónde corre tu backend:
const API_URL =
  // Android emulador:
  'http://10.0.2.2:3000';
// iOS simulator: 'http://localhost:3000'
// Dispositivo físico: 'http://<IP-LAN-de-tu-PC>:3000'

type Problem = {
  id?: string;
  a: number;
  b: number;
  questionText?: string;
  solution?: number;
};

export const Addition = () => {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  const start = async () => {
    try {
      setLoading(true);
      setFeedback('');
      setProblem(null);
      setAnswer('');

      // 1) crear sesión
      const s = await axios.post(`${API_URL}/session/start`);
      const sid = s.data?.sessionId;
      if (!sid) throw new Error('No sessionId from server');
      setSessionId(sid);

      // 2) primer problema
      const n = await axios.post(`${API_URL}/session/next`, { sessionId: sid, locale: 'es' });
      const p = n.data?.problem;
      if (!p) throw new Error('No problem from server');
      setProblem(p);
    } catch (e: any) {
      Alert.alert('Error', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const grade = async () => {
    if (!problem || !sessionId) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/session/grade`, {
        sessionId,
        userAnswer: Number(answer),
        locale: 'es',
      });
      const data = res.data;
      setFeedback(`${data.correct ? '✅' : '❌'} ${data.feedback ?? ''}`);
    } catch (e: any) {
      Alert.alert('Error corrigiendo', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const n = await axios.post(`${API_URL}/session/next`, { sessionId, locale: 'es' });
      const p = n.data?.problem;
      if (!p) throw new Error('No problem from server');
      setProblem(p);
      setAnswer('');
      setFeedback('');
    } catch (e: any) {
      Alert.alert('Error', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suma con IA (backend adaptativo)</Text>
      <Button title="Nueva sesión (IA)" onPress={start} />
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

      {problem ? (
        <View style={styles.card}>
          <Text style={styles.question}>
            {problem.questionText ?? `¿Cuánto es ${problem.a} + ${problem.b}?`}
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Tu respuesta"
            value={answer}
            onChangeText={setAnswer}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button title="Revisar (IA)" onPress={grade} />
            <Button title="Siguiente" onPress={next} />
          </View>
          {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
        </View>
      ) : (
        <Text style={{ marginTop: 8 }}>Pulsa “Nueva sesión (IA)”.</Text>
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
  feedback: { marginTop: 8, fontSize: 16 }
});