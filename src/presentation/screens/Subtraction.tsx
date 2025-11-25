import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:3000';
const OP = 'sub'; // Ajusta si tu backend usa otro nombre

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

export const Subtraction = () => {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  // nivel + stats
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [streak, setStreak] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);
  const [correctSolved, setCorrectSolved] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const lastGradedProblemId = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const applyStateFromBackend = (data: any) => {
    const state = data?.state;
    if (!state) return;

    if (typeof state.level === 'number') {
      setCurrentLevel(state.level);
    }
    if (typeof state.streak === 'number') {
      setStreak(state.streak);
    }
    if (typeof state.correct === 'number') {
      setCorrectSolved(state.correct);
    }
    if (typeof state.total === 'number') {
      setTotalSolved(state.total);
    } else if (
      typeof state.correct === 'number' &&
      typeof state.wrong === 'number'
    ) {
      setTotalSolved(state.correct + state.wrong);
    }
  };

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
      setCurrentLevel(1);

      const s = await axios.post(`${API_URL}/session/start`, { op: OP });
      const sid = s.data?.sessionId;
      if (!sid) throw new Error('No sessionId from server');
      setSessionId(sid);

      applyStateFromBackend(s.data);

      const n = await axios.post(`${API_URL}/session/next`, {
        sessionId: sid,
        op: OP,
        locale: 'es',
      });
      const p = n.data?.problem;
      if (!p) throw new Error('No problem from server');
      setProblem(p);

      applyStateFromBackend(n.data);
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
        op: OP,
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

      applyStateFromBackend(n.data);
    } catch (e: any) {
      Alert.alert('Error', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const parseNumber = (txt: string) => {
    // Permite negativos y coma decimal
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

      applyStateFromBackend(data);
      setTotalSolved(t => t + 1);

      if (data.correct) {
        setFeedback(`✅ ¡Muy bien! ${data.feedback ?? ''}`);
        setLastCorrect(true);
        setCorrectSolved(c => c + 1);
        setStreak(s => s + 1);
      } else {
        setFeedback(`❌ Casi, revisa con calma. ${data.feedback ?? ''}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, problem?.id]);

  const feedbackBoxStyle = [
    styles.feedbackBox,
    lastCorrect === true && styles.feedbackCorrect,
    lastCorrect === false && styles.feedbackIncorrect,
  ];

  const mascotMessage = (() => {
    if (!totalSolved)
      return '¡Bienvenido! Practiquemos restas dando pasos hacia atrás 😊';
    if (lastCorrect === true) {
      if (streak >= 3)
        return '🔥 ¡Racha increíble! Ya dominas las restas, sigamos.';
      return '✅ Buen trabajo, sigamos practicando.';
    }
    if (lastCorrect === false) {
      return 'Imagina que quitas objetos: piensa cuánto te queda 💛';
    }
    return 'Cada intento te ayuda a entender mejor las restas ✨';
  })();

  const accuracy =
    totalSolved > 0 ? Math.round((correctSolved / totalSolved) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* BANNER SUPERIOR */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.appTitle}>Restas</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Nivel {currentLevel}</Text>
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
            <Text style={styles.cardTitle}>Resuelve la siguiente resta</Text>

            <Text style={styles.helperText}>
              {problem.questionText ?? `¿Cuánto es ${problem.a} − ${problem.b}?`}
            </Text>

            {/* BURBUJA DE OPERACIÓN */}
            <View style={styles.operationContainer}>
              <Text style={styles.operationNumber}>{problem.a}</Text>
              <Text style={styles.operationSymbol}>−</Text>
              <Text style={styles.operationNumber}>{problem.b}</Text>
              <Text style={styles.operationSymbol}>=</Text>

              <TextInput
                style={styles.operationInput}
                keyboardType={
                  Platform.OS === 'ios'
                    ? 'numbers-and-punctuation'
                    : 'numeric'
                }
                placeholder="?"
                placeholderTextColor="rgba(37,53,71,0.5)"
                value={answer}
                onChangeText={setAnswer}
                onSubmitEditing={grade}
              />
            </View>

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
                  Imagina que tienes {problem.a} objetos y quitas {problem.b}.  
                  Puedes pensar en una recta numérica: empieza en {problem.a} y
                  da {problem.b} pasos hacia atrás para encontrar el resultado.
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
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(streak * 20, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>Racha actual</Text>
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
            <Text style={styles.mascotEmoji}>➖</Text>
            <Text style={styles.mascotText}>{mascotMessage}</Text>
          </View>

          {/* PANEL INFERIOR CON PROGRESO DEL DÍA */}
          <View style={styles.bottomPanel}>
            <Text style={styles.bottomPanelTitle}>Tu progreso de hoy</Text>

            <View style={styles.bottomPanelRow}>
              <View style={styles.bottomPanelItem}>
                <Text style={styles.bottomPanelItemTitle}>Intentos totales</Text>
                <Text style={styles.bottomPanelItemValue}>{totalSolved}</Text>
              </View>
              <View style={styles.bottomPanelItem}>
                <Text style={styles.bottomPanelItemTitle}>Correctas</Text>
                <Text style={styles.bottomPanelItemValue}>{correctSolved}</Text>
              </View>
            </View>

            <View style={styles.bottomPanelRow}>
              <View style={styles.bottomPanelItem}>
                <Text style={styles.bottomPanelItemTitle}>Precisión</Text>
                <Text style={styles.bottomPanelItemValue}>{accuracy}%</Text>
              </View>
              <View style={styles.bottomPanelItem}>
                <Text style={styles.bottomPanelItemTitle}>Meta sugerida</Text>
                <Text style={styles.bottomPanelItemValue}>10 ejercicios</Text>
              </View>
            </View>

            <Text style={styles.bottomPanelHint}>
              Cuando llegues a tu meta, ¡desbloquearás nuevas actividades de
              restas! 🎉
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.loadingText}>Cargando problema...</Text>
      )}

      {/* FOOTER CON ICONOS SUAVES */}
      <View style={styles.footerArt}>
        <Text style={styles.footerIcon}>➖</Text>
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
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.cream,
  },
  bannerText: {
    marginTop: 4,
    fontSize: 15,
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
    fontSize: 17,
    color: COLORS.cream,
    marginBottom: 10,
    fontWeight: '600',
  },

  helperText: {
    fontSize: 17,
    color: COLORS.cream,
    textAlign: 'center',
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
    marginTop: 20,
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
    fontSize: 15,
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

  // PANEL INFERIOR
  bottomPanel: {
    marginTop: 20,
    backgroundColor: '#203a4b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bottomPanelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cream,
    marginBottom: 10,
  },
  bottomPanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bottomPanelItem: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#1b3444',
  },
  bottomPanelItemTitle: {
    fontSize: 11,
    color: 'rgba(243,235,223,0.85)',
  },
  bottomPanelItemValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cream,
  },
  bottomPanelHint: {
    marginTop: 10,
    fontSize: 12,
    color: 'rgba(243,235,223,0.9)',
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