import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ActivityIndicator, Alert, FlatList } from 'react-native';
import axios from 'axios';

// Cambia esto según dónde corre tu backend:
const API_URL =
  // Android emulador:
  'http://10.0.2.2:3000';
// iOS simulador (en Mac):
// 'http://localhost:3000';
// Dispositivo físico (misma red):
// 'http://TU.IP.LAN:3000';

type Problem = { id?: string; a: number; b: number; questionText?: string; solution?: number };

export const Addition = () => {
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setFeedback('');
      const res = await axios.post(`${API_URL}/generate`, { count: 5, maxNum: 20, locale: 'es' });
      // el endpoint devuelve { problems: [...] } (según la versión que pegaste)
      const arr = res.data?.problems ?? [];
      if (!arr.length) throw new Error('Sin problemas generados');
      setProblems(arr);
      setCurrent(0);
      setAnswer('');
    } catch (e: any) {
      Alert.alert('Error generando', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const grade = async () => {
    const p = problems[current];
    if (!p) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/grade`, { a: p.a, b: p.b, userAnswer: Number(answer), locale: 'es' });
      const data = res.data;
      setFeedback(`${data.correct ? '✅' : '❌'} ${data.feedback ?? ''}`);
    } catch (e: any) {
      Alert.alert('Error corrigiendo', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (current + 1 < problems.length) {
      setCurrent(i => i + 1);
      setAnswer('');
      setFeedback('');
    } else {
      Alert.alert('Fin', 'Genera un nuevo set.');
    }
  };

  const p = problems[current];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suma con IA (backend)</Text>
      <Button title="Nuevo set (IA)" onPress={load} />
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

      {p ? (
        <View style={styles.card}>
          <Text style={styles.question}>{p.questionText ?? `¿Cuánto es ${p.a} + ${p.b}?`}</Text>
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
        <Text style={{ marginTop: 8 }}>Pulsa “Nuevo set (IA)”.</Text>
      )}

      <FlatList
        style={{ marginTop: 12, maxHeight: 160 }}
        data={problems}
        keyExtractor={(_, i) => `p-${i}`}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.questionText ?? `${item.a} + ${item.b}`}</Text>
        )}
        ListEmptyComponent={<Text style={{ color: '#777' }}>Sin lista aún.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 12 },
  question: { fontSize: 18, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff', marginBottom: 10 },
  feedback: { marginTop: 8, fontSize: 16 },
  item: { fontFamily: 'monospace', paddingVertical: 2 },
});