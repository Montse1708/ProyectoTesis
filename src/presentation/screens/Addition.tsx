import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Button, TextInput, View, Text, StyleSheet } from 'react-native';

export const Addition = () => {
  const [isModelReady, setIsModelReady] = useState(false);
  const [number1, setNumber1] = useState<number | null>(null);
  const [number2, setNumber2] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [model, setModel] = useState<tf.Sequential | null>(null);

  // Initialize TensorFlow and the model
  useEffect(() => {
    const initializeModel = async () => {
      console.log("TensorFlow is loading...");
      await tf.ready();
      console.log("TensorFlow is ready!");

      const trainedModel = await createAdditionModel();
      setModel(trainedModel);
      setIsModelReady(true);
      console.log("Model is ready!");
    };

    initializeModel();
  }, []);

  const createAdditionModel = async (): Promise<tf.Sequential> => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [2] }));
    model.add(tf.layers.dense({ units: 1 }));
    console.log("Modelo compilado");
  
  
    console.log("Modelo compilado");
  
    const inputs = tf.tensor2d([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ]);
    const outputs = tf.tensor2d([
      [3],
      [7],
      [11],
      [15],
    ]);
  
    const trainModel = async () => {
      console.log("Entrenando el modelo...");
      try {
        await model.fit(inputs, outputs, {
          epochs: 5, // Puedes ajustar este número
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              console.log(`Epoch ${epoch + 1}: Loss = ${logs?.loss}`);
            },
          },
        });
        console.log("Entrenamiento del modelo completado!");
      } catch (error) {
        console.error("Error durante el entrenamiento:", error);
      }
    };
  
    // Llamar a la función de entrenamiento de manera asíncrona
    await trainModel();
  
    return model;
  };  

  const generateSum = () => {
    if (!model) {
      console.log("Model is not ready yet.");
      return;
    }
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    setNumber1(num1);
    setNumber2(num2);
    setFeedback('');
    setUserAnswer('');
  };

  const checkAnswer = async () => {
    if (model && number1 !== null && number2 !== null) {
      const inputTensor = tf.tensor2d([[number1, number2]]);
      const predictedTensor = model.predict(inputTensor) as tf.Tensor;
      const predictedValue = (await predictedTensor.data())[0];

      // Log the values for debugging
      console.log(`User Answer: ${userAnswer}, Predicted Value: ${predictedValue}`);

      // Convert the user's answer to a number
      const answer = parseFloat(userAnswer);

      if (!isNaN(answer) && Math.abs(predictedValue - answer) < 1) {
        setFeedback('Correct! Great job!');
      } else {
        setFeedback(`Incorrect. The correct answer is ${Math.round(predictedValue)}.`);
      }
    }
  };

  return (
    <View style={styles.container}>
      {isModelReady ? (
        <>
          <Text style={styles.header}>AI-Generated Addition</Text>
          {number1 !== null && number2 !== null ? (
            <Text style={styles.question}>
              What is {number1} + {number2}?
            </Text>
          ) : (
            <Text style={styles.prompt}>Press "Generate" to start!</Text>
          )}
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={userAnswer}
            onChangeText={(text) => setUserAnswer(text)}
            placeholder="Enter your answer"
          />
          <Button title="Check Answer" onPress={checkAnswer} />
          <Text style={styles.feedback}>{feedback}</Text>
          <Button title="Generate Sum" onPress={generateSum} />
        </>
      ) : (
        <Text>Loading model...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  question: {
    fontSize: 20,
    marginBottom: 16,
  },
  prompt: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    width: '80%',
    marginBottom: 16,
    fontSize: 16,
  },
  feedback: {
    fontSize: 18,
    marginVertical: 16,
  },
});
