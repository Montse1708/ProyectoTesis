import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:3000';

const COLORS = {
  tealDark: '#1d4a3b',
  navy: '#253547',
  cream: '#f3ebdf',
  accent: '#e8ba61',
  white: '#ffffff',
};

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
  const [grading, setGrading] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  // nuevos estados para stats y pistas
  const [streak, setStreak] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);
  const [correctSolved, setCorrectSolved] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const lastGradedProblemId = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const start = async () => {
    try {
      setLoading(true);
      setFeedback('');
      setProblem(null);
      setAnswer('');
      setLastCorrect(null);
      setStreak(0);
      setTotalSolved(0);
      setCorrectSolved(0);
      setShowHint(false);

      const s = await axios.post(`${API_URL}/session/start`, { op: 'add' });
      const sid = s.data?.sessionId;
      if (!sid) throw new Error('No sessionId from server');
      setSessionId(sid);

      const n = await axios.post(`${API_URL}/session/next`, {
        sessionId: sid,
        op: 'add',
        locale: 'es',
      });
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
      const n = await axios.post(`${API_URL}/session/next`, {
        sessionId,
        op: 'add',
        locale: 'es',
      });
      const p = n.data?.problem;
      if (!p) throw new Error('No problem from server');
      setProblem(p);
      setAnswer('');
      setFeedback('');
      setLastCorrect(null);
      lastGradedProblemId.current = null;
      setShowHint(false);
    } catch (e: any) {
      Alert.alert('Error', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const grade = async () => {
    if (!problem || !sessionId) return;
    if (grading) return;
    if ((answer ?? '').trim() === '') return;
    if (lastGradedProblemId.current === problem.id) return;

    try {
      setGrading(true);
      const res = await axios.post(`${API_URL}/session/grade`, {
        sessionId,
        userAnswer: Number(answer),
        locale: 'es',
      });
      const data = res.data;

      // stats locales
      setTotalSolved(t => t + 1);

      if (data.correct) {
        setFeedback(`¡Muy bien! ${data.feedback ?? ''}`);
        setLastCorrect(true);
        setCorrectSolved(c => c + 1);
        setStreak(s => s + 1);
      } else {
        setFeedback(`Casi, revisa con calma. ${data.feedback ?? ''}`);
        setLastCorrect(false);
        setStreak(0);
      }

      setShowHint(false);

      setTimeout(() => {
        fetchNext();
      }, 900);

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
  }, [answer, problem?.id]);

  const feedbackBoxStyle = [
    styles.feedbackBox,
    lastCorrect === true && styles.feedbackCorrect,
    lastCorrect === false && styles.feedbackIncorrect,
  ];

  const mascotMessage = (() => {
    if (!totalSolved) return '¡Bienvenido! Empecemos con sumas sencillas 😊';
    if (lastCorrect === true) {
      if (streak >= 3) return '🔥 ¡Racha increíble! Sigue así, lo estás haciendo genial.';
      return '✅ ¡Buen trabajo! Vamos por el siguiente.';
    }
    if (lastCorrect === false) {
      return 'No pasa nada si te equivocas, tómate tu tiempo y vuelve a intentarlo 💛';
    }
    return 'Sigue practicando, cada intento cuenta ✨';
  })();

  const accuracy =
    totalSolved > 0 ? Math.round((correctSolved / totalSolved) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* BANNER SUPERIOR */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.appTitle}>DysMath AI</Text>
          <Text style={styles.bannerText}>Practica sumas de forma divertida ✨</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+ Nivel 1</Text>
        </View>
      </View>

      {(loading || grading) && (
        <ActivityIndicator style={{ marginTop: 14 }} color={COLORS.accent} />
      )}

      {/* CONTENIDO PRINCIPAL */}
      {problem ? (
        <>
          {/* TARJETA PRINCIPAL */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resuelve las siguientes sumas</Text>

            {/* BURBUJA DE OPERACIÓN */}
            <View style={styles.operationContainer}>
              <Text style={styles.operationNumber}>{problem.a}</Text>
              <Text style={styles.operationSymbol}>+</Text>
              <Text style={styles.operationNumber}>{problem.b}</Text>
              <Text style={styles.operationSymbol}>=</Text>

              <TextInput
                style={styles.operationInput}
                keyboardType="numeric"
                placeholder="?"
                placeholderTextColor="rgba(37,53,71,0.5)"
                value={answer}
                onChangeText={setAnswer}
                onSubmitEditing={grade}
              />
            </View>

            <Text style={styles.helperText}>
              {problem.questionText ??
                'Escribe el resultado en el cuadro blanco. Tu respuesta se revisa automáticamente.'}
            </Text>

            {/* BOTÓN DE PISTA */}
            <View style={styles.hintRow}>
              <TouchableOpacity
                style={styles.hintButton}
                onPress={() => setShowHint(prev => !prev)}
                disabled={grading || loading}
              >
                <Text style={styles.hintButtonText}>💡 Ver pista</Text>
              </TouchableOpacity>
            </View>

            {showHint && (
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>
                  Suma paso a paso: empieza en {problem.a} y cuenta {problem.b} números
                  más. Por ejemplo, {problem.a} + 1, + 2, + 3, hasta llegar al resultado.
                </Text>
              </View>
            )}

            {!!feedback && (
              <View style={feedbackBoxStyle}>
                <Text style={styles.feedbackText}>{feedback}</Text>
              </View>
            )}

            {/* TIRA DE PROGRESO VISUAL */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(streak * 20, 100)}%` }]} />
              </View>
              <Text style={styles.progressLabel}>Practicando…</Text>
            </View>
          </View>

          {/* STATS RÁPIDAS */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>⭐ Racha</Text>
              <Text style={styles.statValue}>{streak}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>🎯 Correctas</Text>
              <Text style={styles.statValue}>{correctSolved}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>📊 Precisión</Text>
              <Text style={styles.statValue}>{accuracy}%</Text>
            </View>
          </View>

          {/* MASCOTA / MENSAJE MOTIVACIONAL */}
          <View style={styles.mascotContainer}>
            <Text style={styles.mascotEmoji}>🧠</Text>
            <Text style={styles.mascotText}>{mascotMessage}</Text>
          </View>
        </>
      ) : (
        <Text style={styles.loadingText}>Cargando problema...</Text>
      )}

      {/* FOOTER CON ICONOS SUAVES */}
      <View style={styles.footerArt}>
        <Text style={styles.footerIcon}>➕</Text>
        <Text style={styles.footerIcon}>🔢</Text>
        <Text style={styles.footerIcon}>✏️</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // FONDO GENERAL
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  // BANNER
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.cream,
  },
  bannerText: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(243,235,223,0.8)',
  },
  badge: {
    backgroundColor: COLORS.tealDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  badgeText: {
    color: COLORS.cream,
    fontSize: 12,
    fontWeight: '600',
  },

  // CARD
  card: {
    backgroundColor: COLORS.tealDark,
    borderRadius: 22,
    padding: 18,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 10,
    fontWeight: '600',
  },

  // OPERACIÓN
  operationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 14,
  },
  operationNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.navy,
    marginHorizontal: 4,
  },
  operationSymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent,
    marginHorizontal: 4,
  },
  operationInput: {
    minWidth: 60,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.navy,
    marginLeft: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.white,
  },

  helperText: {
    fontSize: 14,
    color: COLORS.cream,
    textAlign: 'center',
  },

  // BOTÓN DE PISTA
  hintRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  hintButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  hintButtonText: {
    color: COLORS.navy,
    fontWeight: '700',
    fontSize: 13,
  },
  hintBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(243,235,223,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243,235,223,0.35)',
  },
  hintText: {
    fontSize: 13,
    color: COLORS.cream,
  },

  // FEEDBACK
  feedbackBox: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(243,235,223,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(243,235,223,0.25)',
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(232,186,97,0.2)',
    borderColor: COLORS.accent,
  },
  feedbackIncorrect: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderColor: 'rgba(0,0,0,0.4)',
  },
  feedbackText: {
    fontSize: 14,
    color: COLORS.cream,
  },

  // PROGRESO VISUAL
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(243,235,223,0.2)',
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 999,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.cream,
  },

  // STATS
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  statPill: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#1d3a4b',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(243,235,223,0.8)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cream,
    marginTop: 2,
  },

  // MASCOTA
  mascotContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#203a4b',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mascotEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  mascotText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.cream,
  },

  loadingText: {
    marginTop: 16,
    color: COLORS.cream,
  },

  // FOOTER ICONS
  footerArt: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 0.08,
  },
  footerIcon: {
    fontSize: 32,
    color: COLORS.cream,
  },
});