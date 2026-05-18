/**
 * test-notificaciones.tsx
 *
 * 🧪 Pantalla de prueba manual del sistema de notificaciones push.
 * Accesible en: /(socio)/test-notificaciones
 *
 * Solo para uso en desarrollo/QA. Recomendación: proteger con un flag
 * de entorno (__DEV__) antes de subir a producción.
 */

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@services/supabase';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TestStatus = 'idle' | 'sending' | 'ok' | 'error';

interface TestCase {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  payload: {
    title: string;
    body: string;
    data: Record<string, unknown>;
  };
  /** Pantalla esperada al tocar la notificación */
  expectedRoute: string;
}

interface TestResult {
  caseId: string;
  label: string;
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
  sent: number;
  errors: number;
}

// ─── Casos de prueba ──────────────────────────────────────────────────────────

const TEST_CASES: TestCase[] = [
  {
    id: 'bienvenida',
    label: 'Bienvenida',
    description: 'Notificación de bienvenida al sistema',
    icon: 'hand-right-outline',
    color: Colors.accent,
    payload: {
      title: '¡Bienvenido a L&J! 👋',
      body: 'Tu cuenta fue activada. Ya podés reservar clases y mucho más.',
      data: { tipo: 'bienvenida' },
    },
    expectedRoute: '/(socio)/clases',
  },
  {
    id: 'reserva_confirmada',
    label: 'Reserva confirmada',
    description: 'Cuando el usuario reserva una clase con crédito o seña',
    icon: 'checkmark-circle-outline',
    color: Colors.success,
    payload: {
      title: '✅ Reserva confirmada',
      body: 'Reservaste la clase de Pádel del miércoles 21 de mayo a las 19:00.',
      data: { tipo: 'reserva_confirmada', claseId: 'test-clase-id-123' },
    },
    expectedRoute: '/(socio)/reservas',
  },
  {
    id: 'reserva_cancelada',
    label: 'Reserva cancelada',
    description: 'Confirmación de cancelación con detalle de reembolso',
    icon: 'close-circle-outline',
    color: Colors.warning,
    payload: {
      title: 'Reserva cancelada',
      body: 'Tu reserva de Fútbol 5 del viernes fue cancelada. Se reintegró 1 crédito a tu saldo.',
      data: { tipo: 'cancelacion', reservaId: 'test-reserva-id-456' },
    },
    expectedRoute: '/(socio)/reservas',
  },
  {
    id: 'lista_espera',
    label: 'Lugar en lista de espera',
    description: 'Se liberó un cupo — el usuario tiene 15 min para confirmar',
    icon: 'time-outline',
    color: Colors.info,
    payload: {
      title: '¡Lugar disponible! 🎉',
      body: 'Se liberó un lugar en la clase de Vóley del jueves 22 de mayo a las 20:00. Tenés 15 minutos para confirmar.',
      data: { tipo: 'lista_espera', claseId: 'test-clase-id-123', action: 'abrir_clase' },
    },
    expectedRoute: '/(socio)/clase/[test-clase-id]',
  },
  {
    id: 'clase_suspendida',
    label: 'Clase suspendida',
    description: 'Cuando el gestor suspende una clase con reservas activas',
    icon: 'warning-outline',
    color: Colors.danger,
    payload: {
      title: 'Clase suspendida ⚠️',
      body: 'La clase de Básquet del lunes 19 de mayo a las 18:00hs fue suspendida. Tu reserva fue cancelada automáticamente.',
      data: { tipo: 'clase_suspendida', claseId: 'test-clase-id-789' },
    },
    expectedRoute: '/(socio)/reservas',
  },
  {
    id: 'recordatorio',
    label: 'Recordatorio de clase',
    description: 'Aviso 1 hora antes del inicio de la clase',
    icon: 'alarm-outline',
    color: Colors.accent,
    payload: {
      title: '⏰ Tu clase es en 1 hora',
      body: 'Recordá que tenés Pádel a las 19:00. ¡Llegá 10 minutos antes para calentar!',
      data: { tipo: 'recordatorio', claseId: 'test-clase-id-123' },
    },
    expectedRoute: '/(socio)/clase/[test-clase-id]',
  },
];

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function TestNotificacionesScreen() {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [results, setResults] = useState<TestResult[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  // ── Obtener token local para debug ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await Notifications.getExpoPushTokenAsync({
          projectId: 'fcc2e74d-f0b9-47ab-a5c1-1eccdc8df120',
        });
        setPushToken(data);
      } catch (e: any) {
        setPushToken(`⚠️ ${e.message}`);
      } finally {
        setTokenLoading(false);
      }
    })();
  }, []);

  // ── Obtener URL de Supabase ───────────────────────────────────────────────
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

  // ── Enviar notificación de prueba ─────────────────────────────────────────
  async function handleTest(tc: TestCase) {
    if (!usuario) return;
    setStatuses((prev) => ({ ...prev, [tc.id]: 'sending' }));

    const timestamp = new Date().toLocaleTimeString('es-AR');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sin sesión activa');

      const res = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userIds: [usuario.id],
          title: tc.payload.title,
          body: tc.payload.body,
          data: tc.payload.data,
          priority: 'high',
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

      const sent = json.sent ?? 0;
      const errors = json.errors ?? 0;

      if (sent === 0 && errors === 0) {
        // Sin tokens activos en este dispositivo
        const result: TestResult = {
          caseId: tc.id,
          label: tc.label,
          status: 'error',
          message: 'No hay tokens activos. ¿Aceptaste los permisos?',
          timestamp,
          sent: 0,
          errors: 0,
        };
        setResults((prev) => [result, ...prev.slice(0, 9)]);
        setStatuses((prev) => ({ ...prev, [tc.id]: 'error' }));
        return;
      }

      const result: TestResult = {
        caseId: tc.id,
        label: tc.label,
        status: errors === 0 ? 'ok' : 'error',
        message: errors === 0
          ? `Enviada a ${sent} dispositivo${sent !== 1 ? 's' : ''}`
          : `${sent} OK · ${errors} error${errors !== 1 ? 's' : ''}`,
        timestamp,
        sent,
        errors,
      };

      setResults((prev) => [result, ...prev.slice(0, 9)]);
      setStatuses((prev) => ({ ...prev, [tc.id]: errors === 0 ? 'ok' : 'error' }));
    } catch (e: any) {
      const result: TestResult = {
        caseId: tc.id,
        label: tc.label,
        status: 'error',
        message: e.message ?? 'Error desconocido',
        timestamp,
        sent: 0,
        errors: 1,
      };
      setResults((prev) => [result, ...prev.slice(0, 9)]);
      setStatuses((prev) => ({ ...prev, [tc.id]: 'error' }));
    }
  }

  // ── Limpiar resultados ────────────────────────────────────────────────────
  function handleLimpiar() {
    setResults([]);
    setStatuses({});
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>🧪 Test Notificaciones</Text>
          <Text style={styles.headerSub}>Solo visible en desarrollo</Text>
        </View>
        <View style={styles.devBadge}>
          <Text style={styles.devBadgeText}>DEV</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
      >
        {/* ── Info del token ──────────────────────────────────────────────── */}
        <View style={styles.tokenCard}>
          <View style={styles.tokenRow}>
            <Ionicons name="key-outline" size={16} color={Colors.info} />
            <Text style={styles.tokenLabel}>Expo Push Token</Text>
          </View>
          {tokenLoading ? (
            <ActivityIndicator size="small" color={Colors.info} style={{ marginTop: 6 }} />
          ) : (
            <Text style={styles.tokenValue} numberOfLines={2} selectable>
              {pushToken ?? 'No disponible'}
            </Text>
          )}
          <View style={[styles.tokenRow, { marginTop: Spacing.xs }]}>
            <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.tokenMeta} numberOfLines={1}>
              {usuario?.email ?? '—'} · {usuario?.id?.slice(0, 8)}…
            </Text>
          </View>
          <View style={[styles.tokenRow, { marginTop: 2 }]}>
            <Ionicons name="phone-portrait-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.tokenMeta}>{Platform.OS} · {Platform.Version}</Text>
          </View>
        </View>

        {/* ── Casos de prueba ─────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>CASOS DE PRUEBA</Text>

        {TEST_CASES.map((tc) => {
          const status = statuses[tc.id] ?? 'idle';
          return (
            <TestCaseCard
              key={tc.id}
              tc={tc}
              status={status}
              onPress={() => handleTest(tc)}
            />
          );
        })}

        {/* ── Resultados ──────────────────────────────────────────────────── */}
        {results.length > 0 && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>ÚLTIMOS RESULTADOS</Text>
              <TouchableOpacity onPress={handleLimpiar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearBtn}>Limpiar</Text>
              </TouchableOpacity>
            </View>

            {results.map((r, i) => (
              <ResultRow key={`${r.caseId}-${i}`} result={r} />
            ))}
          </>
        )}

        {/* ── Instrucciones ────────────────────────────────────────────────── */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Cómo probar</Text>
            <Text style={styles.infoText}>
              1. Presioná un botón → la notificación se envía vía Edge Function.{'\n'}
              2. Minimizá la app (o cerrala) para ver el banner.{'\n'}
              3. Tocá el banner → verificá que navega a la pantalla correcta.{'\n'}
              4. Con la app abierta, el banner igual aparece (foreground handler activo).
            </Text>
          </View>
        </View>

        <View style={styles.limitacionBox}>
          <Ionicons name="warning-outline" size={16} color={Colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.limitacionTitle}>Limitaciones Expo Go</Text>
            <Text style={styles.limitacionText}>
              En simulador: push no disponible (se necesita dispositivo físico).{'\n'}
              En Expo Go físico: funciona para pruebas básicas.{'\n'}
              Para push 100% real: usar Development Build o APK de producción.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-componente: TestCaseCard ─────────────────────────────────────────────

function TestCaseCard({
  tc, status, onPress,
}: { tc: TestCase; status: TestStatus; onPress: () => void }) {
  const isSending = status === 'sending';

  const statusIcon: Record<TestStatus, string> = {
    idle: 'send-outline',
    sending: 'sync-outline',
    ok: 'checkmark-circle',
    error: 'alert-circle',
  };

  const statusColor: Record<TestStatus, string> = {
    idle: Colors.textMuted,
    sending: Colors.info,
    ok: Colors.success,
    error: Colors.danger,
  };

  return (
    <View style={styles.card}>
      {/* Barra lateral de color */}
      <View style={[styles.cardBar, { backgroundColor: tc.color }]} />

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={[styles.iconCircle, { backgroundColor: tc.color + '20' }]}>
            <Ionicons name={tc.icon as any} size={20} color={tc.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>{tc.label}</Text>
            <Text style={styles.cardDesc}>{tc.description}</Text>
          </View>
        </View>

        {/* Preview del mensaje */}
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle} numberOfLines={1}>{tc.payload.title}</Text>
          <Text style={styles.previewBody} numberOfLines={2}>{tc.payload.body}</Text>
          <View style={styles.routeRow}>
            <Ionicons name="navigate-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.routeText}>{tc.expectedRoute}</Text>
          </View>
        </View>

        {/* Botón de envío */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { borderColor: tc.color },
            status === 'ok' && styles.sendBtnOk,
            status === 'error' && styles.sendBtnError,
            isSending && { opacity: 0.7 },
          ]}
          onPress={onPress}
          disabled={isSending}
          activeOpacity={0.75}
          accessibilityLabel={`Enviar ${tc.label}`}
          accessibilityRole="button"
        >
          {isSending ? (
            <ActivityIndicator size="small" color={tc.color} />
          ) : (
            <>
              <Ionicons
                name={statusIcon[status] as any}
                size={15}
                color={status === 'idle' ? tc.color : statusColor[status]}
              />
              <Text style={[styles.sendBtnText, { color: status === 'idle' ? tc.color : statusColor[status] }]}>
                {status === 'idle'  && 'Enviar notificación'}
                {status === 'ok'   && 'Enviada ✓ — Enviar de nuevo'}
                {status === 'error' && 'Error — Reintentar'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Sub-componente: ResultRow ────────────────────────────────────────────────

function ResultRow({ result }: { result: TestResult }) {
  return (
    <View style={[styles.resultRow, result.status === 'ok' ? styles.resultRowOk : styles.resultRowError]}>
      <Ionicons
        name={result.status === 'ok' ? 'checkmark-circle' : 'alert-circle'}
        size={16}
        color={result.status === 'ok' ? Colors.success : Colors.danger}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.resultLabel}>{result.label}</Text>
        <Text style={styles.resultMsg}>{result.message}</Text>
      </View>
      <Text style={styles.resultTime}>{result.timestamp}</Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: '#0f3460',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textInverse },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.5)' },
  devBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  devBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.textInverse, letterSpacing: 1 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },

  // Token card
  tokenCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.info + '40',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  tokenRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tokenLabel: { ...Typography.label, color: Colors.info, fontWeight: '700' },
  tokenValue: { ...Typography.caption, color: Colors.textPrimary, fontFamily: 'monospace', marginTop: 4 },
  tokenMeta: { ...Typography.caption, color: Colors.textMuted },

  // Sections
  sectionTitle: {
    ...Typography.caption, color: Colors.textMuted,
    fontWeight: '700', letterSpacing: 1,
    marginTop: Spacing.xs,
  },

  // Card de caso de prueba
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardBar: { width: 4 },
  cardContent: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  cardLabel: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },
  cardDesc: { ...Typography.caption, color: Colors.textSecondary },

  // Preview del mensaje
  previewBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  previewTitle: { ...Typography.label, fontWeight: '700', color: Colors.textPrimary },
  previewBody: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  routeText: { ...Typography.caption, color: Colors.textMuted, fontFamily: 'monospace' },

  // Botón enviar
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5, borderRadius: Radius.md,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  sendBtnOk: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  sendBtnError: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  sendBtnText: { ...Typography.label, fontWeight: '700' },

  // Resultados
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.xs,
  },
  clearBtn: { ...Typography.caption, color: Colors.accent, fontWeight: '700' },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
  },
  resultRowOk: { borderColor: Colors.success + '40' },
  resultRowError: { borderColor: Colors.danger + '40' },
  resultLabel: { ...Typography.label, fontWeight: '700', color: Colors.textPrimary },
  resultMsg: { ...Typography.caption, color: Colors.textSecondary },
  resultTime: { ...Typography.caption, color: Colors.textMuted },

  // Info boxes
  infoBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.infoLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  infoTitle: { ...Typography.label, fontWeight: '700', color: Colors.info, marginBottom: 4 },
  infoText: { ...Typography.caption, color: Colors.info, lineHeight: 18 },
  limitacionBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  limitacionTitle: { ...Typography.label, fontWeight: '700', color: Colors.warning, marginBottom: 4 },
  limitacionText: { ...Typography.caption, color: Colors.warning, lineHeight: 18 },
});
