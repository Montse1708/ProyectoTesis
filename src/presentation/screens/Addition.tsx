import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Button, TextInput, View, Text, StyleSheet } from 'react-native';

export const Addition = () => {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [respuestaUsuario, setRespuestaUsuario] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        // Asegurarse de que TensorFlow esté listo
        await tf.ready();
        console.log('TensorFlow.js está listo con el backend:', tf.getBackend());

        // Crear datos de entrada (pares de números para sumar)
        const inputs = tf.tensor2d([
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
          [9, 10],
          [2, 2],
          [4, 4],
          [6, 6],
          [8, 8],
          [10, 10],
          [12, 14],
          [15, 17],
          [18, 19],
          [20, 22],
          [25, 30],
        ]);

        // Etiquetas correspondientes (las sumas de los pares)
        const labels = tf.tensor2d([
          [3],
          [7],
          [11],
          [15],
          [19],
          [4],
          [8],
          [12],
          [16],
          [20],
          [26],
          [32],
          [37],
          [42],
          [55],
        ]);

        // Normalización de los datos de entrada
        const inputsMax = inputs.max(0); // máximo por columna
        const inputsMin = inputs.min(0); // mínimo por columna
        const range = inputsMax.sub(inputsMin); // rango para evitar división por cero

        // Asegurarse de que no haya división por cero
        const safeRange = range.equal(0).cast('float32').add(1e-8); // Añadir un valor pequeño en caso de que el rango sea cero
        const normalizedInputs = inputs.sub(inputsMin).div(safeRange); // Normalizar con rango seguro

        // Verificar si la normalización es correcta
        normalizedInputs.print(); // Imprimir para verificar

        // Crear un modelo simple
        const newModel = tf.sequential();
        newModel.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [2] }));
        newModel.add(tf.layers.dense({ units: 1 }));

        // Compilar el modelo
        newModel.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

        // Entrenar el modelo
        await newModel.fit(normalizedInputs, labels, { epochs: 5000 }); // Aumentar el número de épocas
        console.log('Modelo entrenado');

        // Establecer el modelo entrenado en el estado
        setModel(newModel);
      } catch (error) {
        console.error('Error al entrenar el modelo:', error);
      }
    };

    init();
  }, []);

  // Generar una nueva pregunta
  const generarPregunta = () => {
    const nuevoNum1 = Math.floor(Math.random() * 10);
    const nuevoNum2 = Math.floor(Math.random() * 10);
    setNum1(nuevoNum1);
    setNum2(nuevoNum2);
    setRespuestaUsuario('');
    setMensaje('');
  };

  // Verificar la respuesta del usuario
  const verificarRespuesta = async () => {
    if (model) {
      try {
        // Normalizar los números antes de pasarlos al modelo
        const input = tf.tensor2d([[num1, num2]]);
        const inputsMax = input.max(0);
        const inputsMin = input.min(0);
        const range = inputsMax.sub(inputsMin);

        // Asegurarse de que no haya división por cero
        const safeRange = range.equal(0).cast('float32').add(1e-8); // Añadir un valor pequeño en caso de que el rango sea cero
        const normalizedInput = input.sub(inputsMin).div(safeRange);

        // Verificar si la normalización es correcta
        normalizedInput.print(); // Imprimir para verificar

        const prediction = model.predict(normalizedInput) as tf.Tensor;
        const resultado = prediction.dataSync()[0];
        const respuestaCorrecta = Math.round(resultado); // Redondear la predicción

        // Verificar si la respuesta del usuario es correcta
        if (parseInt(respuestaUsuario, 10) === respuestaCorrecta) {
          setMensaje('¡Correcto! 🎉');
          generarPregunta();
        } else {
          setMensaje(`Incorrecto. La respuesta correcta era ${respuestaCorrecta}.`);
        }
      } catch (error) {
        console.error('Error al predecir la respuesta:', error);
        setMensaje('Hubo un error al predecir la respuesta.');
      }
    } else {
      setMensaje('El modelo aún no está listo. Por favor, espera.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prueba tus habilidades de suma</Text>
      {!model ? (
        <Text style={styles.message}>Entrenando modelo, por favor espera...</Text>
      ) : (
        <>
          <Text style={styles.question}>{`${num1} + ${num2}`}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Tu respuesta"
            value={respuestaUsuario}
            onChangeText={(text) => setRespuestaUsuario(text)}
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
