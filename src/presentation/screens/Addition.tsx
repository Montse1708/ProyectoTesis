import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList } from 'react-native';

type Example = { id: string; a: number; b: number; result: number };

const randInt = (max: number) => Math.floor(Math.random() * (max + 1));

export const Addition = () => {
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [history, setHistory] = useState<Example[]>([]);
  const [maxNum, setMaxNum] = useState(9);

  // Genera un primer ejercicio al montar
  useEffect(() => {
    generate();
  }, []);

  const generate = () => {
    const x = randInt(maxNum);
    const y = randInt(maxNum);
    setA(x);
    setB(y);
    setAnswer('');
    setFeedback('');
  };

  const check = () => {
    if (a == null || b == null) return;
    const correct = a + b;
    const user = Number(answer);
    if (!Number.isFinite(user)) {
      setFeedback('Ingresa un número válido.');
      return;
    }
    if (user === correct) {
      setFeedback('✅ ¡Correcto! ¡Buen trabajo!');
    } else {
      setFeedback(`❌ Incorrecto. La respuesta es ${correct}.`);
    }
  };

  // “Entrenamiento” simulado: autogenera pares y los guarda en un historial
  // (Sin ML; útil para mostrar que el sistema puede auto-crear ejercicios y soluciones)
  const autoTrain = (n = 50) => {
    const batch: Example[] = [];
    for (let i = 0; i < n; i++) {
      const x = randInt(maxNum);
      const y = randInt(maxNum);
      batch.push({ id: `${Date.now()}-${i}`, a: x, b: y, result: x + y });
    }
    setHistory(prev => [...batch, ...prev].slice(0, 200)); // guarda hasta 200
  };

  const header = useMemo(
    () => (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.header}>Suma sin TF.js (100% RN)</Text>
        <Text style={styles.sub}>Genera ejercicios y valida respuestas sin dependencias nativas.</Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {header}

      <View style={styles.card}>
        <Text style={styles.label}>Rango de números (máx):</Text>
        <View style={styles.row}>
          <Button title="-5" onPress={() => setMaxNum(m => Math.max(1, m - 5))} />
          <Text style={styles.value}>{maxNum}</Text>
          <Button title="+5" onPress={() => setMaxNum(m => Math.min(999, m + 5))} />
        </View>
      </View>

      <View style={styles.card}>
        {a != null && b != null ? (
          <Text style={styles.question}>¿Cuánto es {a} + {b}?</Text>
        ) : (
          <Text style={styles.question}>Presiona “Nueva suma”.</Text>
        )}

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Tu respuesta"
          value={answer}
          onChangeText={setAnswer}
        />

        <View style={styles.row}>
          <Button title="Revisar" onPress={check} />
          <View style={{ width: 12 }} />
          <Button title="Nueva suma" onPress={generate} />
        </View>

        <Text style={styles.feedback}>{feedback}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Autogenerar ejercicios (sin ML)</Text>
        <View style={styles.row}>
          <Button title="+10" onPress={() => autoTrain(10)} />
          <View style={{ width: 12 }} />
          <Button title="+50" onPress={() => autoTrain(50)} />
          <View style={{ width: 12 }} />
          <Button title="Limpiar" onPress={() => setHistory([])} />
        </View>

        <Text style={styles.smallNote}>
          Se crean pares entrada→salida (ej.: “12+7=19”) y se guardan en la lista.
        </Text>

        <FlatList
          style={{ marginTop: 10, maxHeight: 180 }}
          data={history}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => (
            <Text style={styles.exampleItem}>
              {item.a} + {item.b} = {item.result}
            </Text>
          )}
          ListEmptyComponent={<Text style={styles.muted}>No hay ejemplos aún.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  sub: { color: '#666', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  label: { fontWeight: '600', marginBottom: 8 },
  question: { fontSize: 18, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  value: { marginHorizontal: 12, fontSize: 16, minWidth: 32, textAlign: 'center' },
  feedback: { marginTop: 10, fontSize: 16 },
  smallNote: { fontSize: 12, color: '#666', marginTop: 8 },
  exampleItem: { fontFamily: 'monospace', fontSize: 14, paddingVertical: 2 },
  muted: { color: '#999', fontStyle: 'italic' },
});
