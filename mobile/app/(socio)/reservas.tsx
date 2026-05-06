import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel, NivelLabel } from '@constants/theme';
import { EmptyState, ConfirmModal } from '@components/common';
import { useReservas } from '@hooks/useReservas';
import {
  previsualizarCancelacion, cancelarReservaAbonado,
  buildModalMessage, type PreviewCancelacion,
} from '@services/cancelaciones';
import type { Reserva } from '@app-types/index';

// ─── Constantes ───────────────────────────────────────────────────────────────

const DISCIPLINA_COLORS: Record<string, string> = {
  futbol5: Colors.futbol5,
  padel:   Colors.padel,
  voley:   Colors.voley,
  basquet: Colors.basquet,
};

const DISCIPLINA_EMOJI: Record<string, string> = {
  futbol5: '⚽', padel: '🏓', voley: '🏐', basquet: '🏀',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function fechaHoy(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Sub-componente: ReservaCard ──────────────────────────────────────────────

interface ReservaCardProps {
  reserva: Reserva;
  onCancelar: (reserva: Reserva) => void;
  loadingCancelar?: boolean;
}

function ReservaCard({ reserva, onCancelar, loadingCancelar = false }: ReservaCardProps) {
  const clase = reserva.clase as any;
  if (!clase) return null;

  const color      = DISCIPLINA_COLORS[clase.disciplina] ?? Colors.primary;
  const emoji      = DISCIPLINA_EMOJI[clase.disciplina] ?? '🏅';
  const cancelable = clase.fecha >= fechaHoy();

  return (
    <View style={styles.card}>
      {/* Barra lateral de color de disciplina */}
      <View style={[styles.cardBar, { backgroundColor: color }]} />

      <View style={styles.cardBody}>
        {/* Fila superior: disciplina + badge */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardDisciplinaRow}>
            <Text style={styles.cardEmoji}>{emoji}</Text>
            <View>
              <Text style={styles.cardDisciplina}>
                {DisciplinaLabel[clase.disciplina] ?? clase.disciplina}
              </Text>
              <Text style={styles.cardNivel}>
                {NivelLabel[clase.nivel] ?? clase.nivel}
              </Text>
            </View>
          </View>

          <View style={styles.badgeConfirmada}>
            <View style={[styles.badgeDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.badgeText}>Confirmada</Text>
          </View>
        </View>

        {/* Detalles */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.detailText} numberOfLines={1}>
              {formatFecha(clase.fecha)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              {clase.hora_inicio} — {clase.hora_fin}
            </Text>
          </View>
        </View>

        {/* Botón Cancelar — solo clases futuras/de hoy */}
        {cancelable && (
          <TouchableOpacity
            style={[styles.cancelBtn, loadingCancelar && { opacity: 0.6 }]}
            onPress={() => onCancelar(reserva)}
            activeOpacity={0.75}
            disabled={loadingCancelar}
            accessibilityLabel={`Cancelar reserva de ${DisciplinaLabel[clase.disciplina]}`}
            accessibilityRole="button"
          >
            {loadingCancelar ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <Ionicons name="close-circle-outline" size={15} color={Colors.danger} />
            )}
            <Text style={styles.cancelBtnText}>
              {loadingCancelar ? 'Cargando…' : 'Cancelar reserva'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ReservasScreen() {
  const { usuario, refreshUsuario } = useAuth();
  const insets      = useSafeAreaInsets();

  // ── Datos ─────────────────────────────────────────────────────────────────
  const { reservas, loading, refreshing, error, refresh } = useReservas(usuario?.id);

  // ── Estado del modal de cancelación ───────────────────────────────────────
  // reservaACancelar: reserva seleccionada para cancelar
  // preview: datos calculados por el RPC de previsualización (construye el mensaje)
  // cargandoPreview: ID de la reserva cuyo botón está en estado loading (preflight)
  // confirmando: true mientras se ejecuta el RPC de cancelación
  const [reservaACancelar, setReservaACancelar] = useState<Reserva | null>(null);
  const [preview, setPreview]                   = useState<PreviewCancelacion | null>(null);
  const [cargandoPreview, setCargandoPreview]   = useState<string | null>(null);
  const [confirmando, setConfirmando]           = useState(false);

  // ── Pre-flight: calcular escenario antes de abrir el modal ────────────────
  async function handleCancelar(reserva: Reserva) {
    if (!usuario) return;
    setCargandoPreview(reserva.id);
    try {
      const prev = await previsualizarCancelacion(reserva.id, usuario.id);
      setPreview(prev);
      setReservaACancelar(reserva);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la información de cancelación.');
    } finally {
      setCargandoPreview(null);
    }
  }

  function handleCerrarModal() {
    if (confirmando) return;
    setReservaACancelar(null);
    setPreview(null);
  }

  // ── Confirmar cancelación ──────────────────────────────────────────────────
  async function handleConfirmarCancelacion() {
    if (!reservaACancelar || !usuario) return;
    setConfirmando(true);
    try {
      const resultado = await cancelarReservaAbonado(reservaACancelar.id, usuario.id);
      if (resultado.devuelveCredito) await refreshUsuario();
      handleCerrarModal();
      refresh();
      Alert.alert(
        resultado.devuelveCredito ? 'Reserva cancelada ✔' : 'Reserva cancelada',
        resultado.mensaje,
      );
    } catch (err: any) {
      Alert.alert('Error', err?.mensaje ?? 'No se pudo cancelar la reserva. Intentá de nuevo.');
    } finally {
      setConfirmando(false);
    }
  }


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerEyebrow}>TUS CLASES</Text>
        <Text style={styles.title}>Mis reservas</Text>
      </View>

      {/* ── Tabs: Próximas / Historial ──────────────────────────────────── */}
      <View style={styles.tabsBar}>
        {/* Tab activo: Próximas */}
        <View style={styles.tabActive}>
          <Ionicons name="calendar" size={14} color={Colors.accent} />
          <Text style={styles.tabTextActive}>Próximas</Text>
        </View>
        {/* Tab inactivo: Historial — post-MVP */}
        <TouchableOpacity style={styles.tab} activeOpacity={0.7} disabled>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.tabText}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <EmptyState
            icon="⚠️"
            title="No se pudieron cargar tus reservas"
            subtitle={error}
          />
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={r => r.id}
          renderItem={({ item }) => (
            <ReservaCard
              reserva={item}
              onCancelar={handleCancelar}
              loadingCancelar={cargandoPreview === item.id}
            />
          )}
          contentContainerStyle={[
            styles.lista,
            { paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <EmptyState
                icon="📋"
                title="No tenés reservas activas"
                subtitle="Explorá las clases disponibles y reservá tu lugar."
              />
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push('/(socio)/clases' as any)}
                activeOpacity={0.85}
                accessibilityLabel="Explorar clases"
                accessibilityRole="button"
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.textInverse} />
                <Text style={styles.ctaText}>Explorar clases</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── ConfirmModal: cancelación de reserva ───────────────────────── */}
      {reservaACancelar && preview && (() => {
        const { title, message, confirmColor } = buildModalMessage(preview);
        return (
          <ConfirmModal
            visible
            title={title}
            message={message}
            confirmText="Sí, cancelar"
            confirmColor={confirmColor}
            loading={confirmando}
            onConfirm={handleConfirmarCancelacion}
            onCancel={handleCerrarModal}
          />
        );
      })()}

    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerEyebrow: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700', letterSpacing: 1.2, marginBottom: 2,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },

  // Tabs
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', gap: 6,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  tabActive: {
    flex: 1, flexDirection: 'row', gap: 6,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 2, borderBottomColor: Colors.accent,
  },
  tabText: { ...Typography.body, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { ...Typography.body, color: Colors.accent, fontWeight: '700' },

  // Lista
  lista: { padding: Spacing.md, gap: Spacing.sm },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md, gap: Spacing.sm },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardDisciplinaRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1,
  },
  cardEmoji: { fontSize: 22 },
  cardDisciplina: {
    fontSize: 16, fontWeight: '700', color: Colors.textPrimary,
  },
  cardNivel: {
    ...Typography.bodySmall, color: Colors.textSecondary,
  },

  // Badge confirmada
  badgeConfirmada: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    backgroundColor: Colors.successLight,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.success + '40',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { ...Typography.caption, color: Colors.success, fontWeight: '700' },

  // Detalles
  cardDetails: { gap: 4 },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  detailText: {
    ...Typography.bodySmall, color: Colors.textSecondary,
    textTransform: 'capitalize', flexShrink: 1,
  },

  // Cancelar
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 6, paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.danger + '40',
    backgroundColor: Colors.dangerLight,
  },
  cancelBtnText: { ...Typography.caption, color: Colors.danger, fontWeight: '600' },

  // Estados generales
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrapper: {
    flex: 1, alignItems: 'center', gap: Spacing.lg,
    paddingTop: Spacing.xxl,
  },

  // CTA explorar clases
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 13, paddingHorizontal: Spacing.xl,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  ctaText: { ...Typography.body, fontWeight: '700', color: Colors.textInverse },
});
