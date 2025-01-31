import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Button, TextInput, View, Text, StyleSheet } from 'react-native';

export const Addition = () => {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [respuestaUsuario, setRespuestaUsuario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modeloListo, setModeloListo] = useState(false);

  useEffect(() => {
    const cargarModelo = async () => {
      await tf.ready();
      await tf.setBackend('cpu');
      console.log('TensorFlow.js está listo con el backend:', tf.getBackend());

      // Crear modelo secuencial
      const newModel = tf.sequential();
      newModel.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [2] }));
      newModel.add(tf.layers.dense({ units: 1 }));

      newModel.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

      // Datos de entrenamiento
      const inputs = tf.tensor2d([
        [1, 2], [3, 4], [5, 6], [7, 8], [9, 1], 
        [2, 3], [4, 5], [6, 7], [8, 9], [1, 10]
      ]);
      const labels = tf.tensor2d([
        [3], [7], [11], [15], [10],
        [5], [9], [13], [17], [11]
      ]);

      // Entrenar modelo
      await newModel.fit(inputs, labels, { epochs: 1000 });

      // Liberar memoria de tensores
      inputs.dispose();
      labels.dispose();

      console.log('Modelo entrenado correctamente');
      setModel(newModel);
      setModeloListo(true);
    };

    cargarModelo();
  }, []);

  const generarPregunta = () => {
    setNum1(Math.floor(Math.random() * 10));
    setNum2(Math.floor(Math.random() * 10));
    setRespuestaUsuario('');
    setMensaje('');
  };

  const verificarRespuesta = async () => {
    if (model) {
      const input = tf.tensor2d([[num1, num2]]);
      const prediction = model.predict(input) as tf.Tensor;
      const resultado = prediction.dataSync()[0]; // Obtener valor
      input.dispose(); // Liberar memoria
      const respuestaCorrecta = Math.round(resultado);

      if (parseInt(respuestaUsuario, 10) === respuestaCorrecta) {
        setMensaje('¡Correcto! 🎉');
        generarPregunta();
      } else {
        setMensaje(`Incorrecto. La respuesta correcta era ${respuestaCorrecta}.`);
      }
    } else {
      setMensaje('El modelo aún no está listo. Por favor, espera.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prueba tus habilidades de suma</Text>
      {!modeloListo ? (
        <Text style={styles.message}>Entrenando modelo, por favor espera...</Text>
      ) : (
        <>
          <Text style={styles.question}>{`${num1} + ${num2}`}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Tu respuesta"
            value={respuestaUsuario}
            onChangeText={setRespuestaUsuario}
          />
          <Button title="Verificar" onPress={verificarRespuesta} />
          {mensaje && <Text style={styles.message}>{mensaje}</Text>}
        </>
      )}
      <Button title="Generar nueva pregunta" onPress={generarPregunta} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  question: {
    fontSize: 20,
    margin: 10,
  },
  input: {
    padding: 10,
    fontSize: 16,
    margin: 10,
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  message: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Addition;
