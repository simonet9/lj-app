import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@services/supabase';
import { inscribirseEnLista, obtenerPosicionEnLista } from '@services/listaEspera';
import { reservarClaseAbonado, calcularSena, verificarConflictoHorario } from '@services/reservas';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel, NivelLabel } from '@constants/theme';
import type { Clase, ListaEspera } from '@app-types/index';

// ─── Constantes ───────────────────────────────────────────────────────────────

const DISCIPLINA_COLORS: Record<string, string> = {
  futbol5: Colors.futbol5, padel: Colors.padel, voley: Colors.voley, basquet: Colors.basquet,
};

const DISCIPLINA_EMOJI: Record<string, string> = {
  futbol5: '⚽', padel: '🏓', voley: '🏐', basquet: '🏀',
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function ClaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario, refreshUsuario } = useAuth();
  const insets = useSafeAreaInsets();

  // ── Estado de datos ───────────────────────────────────────────────────────
  const [clase, setClase]               = useState<Clase | null>(null);
  const [entradaLista, setEntradaLista] = useState<ListaEspera | null>(null);
  const [loading, setLoading]           = useState(true);

  // ── Estado de acciones ────────────────────────────────────────────────────
  const [reservando, setReservando]     = useState(false);
  const [inscribiendo, setInscribiendo] = useState(false);

  // ── Carga inicial: clase + posición en lista de espera ────────────────────
  useEffect(() => {
    if (!id || !usuario) return;

    async function cargar() {
      setLoading(true);

      // Clase y posición en lista se cargan en paralelo
      const [claseRes, listaRes] = await Promise.all([
        supabase
          .from('clases')
          .select('*, gestor:usuarios(nombre, apellido)')
          .eq('id', id)
          .single(),
        obtenerPosicionEnLista(usuario!.id, id),
      ]);

      if (!claseRes.error && claseRes.data) {
        setClase(claseRes.data as Clase);
      }
      setEntradaLista(listaRes);
      setLoading(false);
    }

    cargar();
  }, [id, usuario]);

  // ── Acción: inscribirse en lista de espera ────────────────────────────────
  async function handleListaEspera() {
    if (!clase || !usuario) return;
    setInscribiendo(true);
    try {
      const { posicion } = await inscribirseEnLista(usuario.id, clase.id);
      // Actualizar estado local para reflejar la nueva posición sin recargar
      setEntradaLista({
        id: '',                // será asignado por Supabase, no crítico aquí
        socio_id: usuario.id,
        clase_id: clase.id,
        posicion,
        notificado_at: null,
        expira_at: null,       // no aplica hasta que el trigger lo asigne
        created_at: new Date().toISOString(),
      });
      Alert.alert(
        'Lista de espera ✓',
        `Quedaste en la posición ${posicion} de la lista de espera. Te avisaremos si se libera un lugar.`,
        [{ text: 'Entendido', style: 'default' }],
      );
    } catch (err: any) {
      // InscripcionFailure es un objeto plano, no una instancia de Error
      const mensaje: string =
        err?.mensaje ?? 'No se pudo procesar la solicitud. Intentá de nuevo.';
      Alert.alert('No se pudo inscribir', mensaje);
    } finally {
      setInscribiendo(false);
    }
  }

  // ── Acción: reservar clase ──────────────────────────────────────────────────
  // Bifurca el flujo por tipo de membersía del socio:
  //   abonado  → RPC con descuento de crédito (HU-08)
  //   eventual → verificar horario + navegar a pago mock (HU-09)
  async function handleReservar() {
    if (!clase || !usuario) return;

    const esAbonado = usuario.membresia === 'abonado';

    // ── Flujo abonado (créditos) ─────────────────────────────────────────
    if (esAbonado) {
      if (usuario.creditos < 1) {
        Alert.alert(
          'Sin créditos',
          'No tenés créditos disponibles para realizar una reserva.',
          [{ text: 'Entendido' }],
        );
        return;
      }

      setReservando(true);
      try {
        const { creditosRestantes } = await reservarClaseAbonado(usuario.id, clase.id);
        await refreshUsuario();
        router.replace({
          pathname: '/(socio)/reserva-confirmada' as any,
          params: {
            disciplina:        clase.disciplina,
            fecha:             clase.fecha,
            horaInicio:        clase.hora_inicio,
            horaFin:           clase.hora_fin,
            creditosRestantes: String(creditosRestantes),
          },
        });
      } catch (err: any) {
        const codigo: string  = err?.codigo  ?? '';
        const mensaje: string = err?.mensaje ?? 'No se pudo procesar la reserva. Intentá de nuevo.';
        if (codigo === 'sin_cupo') {
          Alert.alert(
            'Clase sin cupo',
            `${mensaje}\n\n¿Querés anotarte en la lista de espera?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Lista de espera',
                onPress: () => setClase(prev => prev ? { ...prev, estado: 'completa', cupo_disponible: 0 } : prev),
              },
            ],
          );
        } else {
          Alert.alert('No se pudo reservar', mensaje);
        }
      } finally {
        setReservando(false);
      }
      return;
    }

    // ── Flujo eventual (seña + pago mock) ────────────────────────────────
    setReservando(true);
    try {
      // Verificar conflicto de horario antes de ir al pago
      const hayConflicto = await verificarConflictoHorario(
        usuario.id, clase.fecha, clase.hora_inicio,
      );
      if (hayConflicto) {
        Alert.alert(
          'Horario ocupado',
          'Ya tenés una clase agendada en ese día y horario.',
          [{ text: 'Entendido' }],
        );
        return;
      }

      // Calcular seña (50% del valor por disciplina)
      const sena = calcularSena(clase.disciplina);

      // Navegar a pantalla de pago mock con todos los datos necesarios
      router.push({
        pathname: '/(socio)/pago-mock' as any,
        params: {
          claseId:    clase.id,
          socioId:    usuario.id,
          disciplina: clase.disciplina,
          fecha:      clase.fecha,
          horaInicio: clase.hora_inicio,
          horaFin:    clase.hora_fin,
          monto:      String(sena),
          descripcion: `Reserva de clase de ${DisciplinaLabel[clase.disciplina]} — Seña 50%`,
        },
      });
    } finally {
      setReservando(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  if (!clase) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Clase no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCta} activeOpacity={0.8}>
          <Text style={styles.backCtaText}>Volver a clases</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Variables derivadas ───────────────────────────────────────────────────
  const color      = DISCIPLINA_COLORS[clase.disciplina] ?? Colors.primary;
  const emoji      = DISCIPLINA_EMOJI[clase.disciplina] ?? '🏅';
  const completa   = clase.estado === 'completa' || clase.cupo_disponible === 0;
  const suspendida = clase.estado === 'suspendida';
  const yaEnLista  = entradaLista !== null;
  const ocupacion  = clase.cupo_maximo > 0
    ? Math.round(((clase.cupo_maximo - clase.cupo_disponible) / clase.cupo_maximo) * 100)
    : 0;

  /**
   * Determina el estado del CTA según las 4 reglas de negocio:
   *  1. suspendida          → info (sin botón)
   *  2. completa + en lista → info (posición)
   *  3. completa + sin lista → botón lista de espera (amarillo)
   *  4. disponible          → botón reservar (verde)
   */
  type CtaMode = 'reservar' | 'lista_espera' | 'en_lista' | 'suspendida';
  function getCtaMode(): CtaMode {
    if (suspendida)                    return 'suspendida';
    if (completa && yaEnLista)         return 'en_lista';
    if (completa && !yaEnLista)        return 'lista_espera';
    return 'reservar';
  }
  const ctaMode = getCtaMode();

  return (
    <View style={styles.root}>

      {/* ── Hero oscuro ───────────────────────────────────────────────────── */}
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        {/* Botón atrás */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={18} color={Colors.textInverse} />
          </View>
          <Text style={styles.backLabel}>Clases</Text>
        </TouchableOpacity>

        {/* Hero content */}
        <View style={styles.heroContent}>
          <Text style={styles.heroEmoji}>{emoji}</Text>
          <Text style={styles.heroDisciplina}>{DisciplinaLabel[clase.disciplina] ?? clase.disciplina}</Text>
          <Text style={styles.heroHorario}>{clase.hora_inicio} — {clase.hora_fin}</Text>
          <Text style={styles.heroFecha}>{formatFecha(clase.fecha)}</Text>
        </View>

        {/* Badge de estado */}
        {!suspendida ? (
          <View style={[
            styles.heroBadge,
            { backgroundColor: completa ? Colors.danger + '25' : Colors.success + '25' },
          ]}>
            <Ionicons
              name={completa ? 'close-circle' : 'checkmark-circle'}
              size={14}
              color={completa ? Colors.danger : Colors.success}
            />
            <Text style={[styles.heroBadgeText, { color: completa ? Colors.danger : Colors.success }]}>
              {completa ? 'Clase completa' : `${clase.cupo_disponible} lugares disponibles`}
            </Text>
          </View>
        ) : (
          <View style={[styles.heroBadge, { backgroundColor: Colors.textMuted + '25' }]}>
            <Ionicons name="ban-outline" size={14} color={Colors.textMuted} />
            <Text style={[styles.heroBadgeText, { color: Colors.textMuted }]}>Clase suspendida</Text>
          </View>
        )}
      </View>

      {/* ── Body scrollable ──────────────────────────────────────────────── */}
      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Ocupación */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>OCUPACIÓN</Text>
          <View style={styles.ocupacionRow}>
            <Text style={[styles.ocupacionPct, { color }]}>{ocupacion}%</Text>
            <Text style={styles.ocupacionDetail}>
              {clase.cupo_maximo - clase.cupo_disponible}/{clase.cupo_maximo} inscriptos
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${ocupacion}%` as any, backgroundColor: color }]} />
          </View>

          {/* Nota de lista de espera cuando la clase está completa */}
          {completa && !suspendida && (
            <View style={styles.listaEsperaNote}>
              <Ionicons name="time-outline" size={14} color={Colors.warning} />
              <Text style={styles.listaEsperaText}>
                Podés anotarte en lista de espera — tendrás 15 min para confirmar si se libera un lugar.
              </Text>
            </View>
          )}
        </View>

        {/* Detalles */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DETALLES</Text>
          <DetailRow icon="layers-outline" label="Nivel" value={NivelLabel[clase.nivel] ?? clase.nivel} />
          <DetailRow icon="calendar-outline" label="Fecha" value={formatFecha(clase.fecha)} capitalize />
          <DetailRow icon="time-outline" label="Horario" value={`${clase.hora_inicio} — ${clase.hora_fin}`} />
          {clase.gestor && (
            <DetailRow
              icon="person-outline"
              label="Gestor"
              value={`${clase.gestor.nombre} ${clase.gestor.apellido}`}
              last
            />
          )}
        </View>

        {/* Reglas de cancelación */}
        <View style={[styles.card, styles.cardInfo]}>
          <View style={styles.cardInfoRow}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
            <Text style={styles.cardInfoText}>
              Podés cancelar hasta 48hs antes sin perder el crédito si sos socio abonado.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky CTA — renderizado condicional según ctaMode ──────────── */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + Spacing.sm }]}>

        {ctaMode === 'suspendida' && (
          /* Estado 4: clase suspendida — sin botón */
          <View style={styles.ctaInfo}>
            <Ionicons name="ban-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.ctaInfoText}>Esta clase fue suspendida</Text>
          </View>
        )}

        {ctaMode === 'en_lista' && (
          /* Estado 2: socio ya en lista — mostrar posición */
          <View style={styles.ctaEnLista}>
            <Ionicons name="hourglass-outline" size={20} color={Colors.warning} />
            <Text style={styles.ctaEnListaText}>
              Estás en posición {entradaLista!.posicion} de la lista de espera
            </Text>
          </View>
        )}

        {ctaMode === 'lista_espera' && (
          /* Estado 3: clase completa, socio no en lista */
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonLista, inscribiendo && styles.ctaButtonLoading]}
            onPress={handleListaEspera}
            activeOpacity={0.85}
            disabled={inscribiendo}
            accessibilityLabel="Anotarse en lista de espera"
            accessibilityRole="button"
          >
            {inscribiendo ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Ionicons name="time-outline" size={20} color={Colors.textInverse} />
                <Text style={styles.ctaText}>Anotarse en lista de espera</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {ctaMode === 'reservar' && (
          /* Estado 1: clase disponible */
          <TouchableOpacity
            style={[styles.ctaButton, reservando && styles.ctaButtonLoading]}
            onPress={handleReservar}
            activeOpacity={0.85}
            disabled={reservando}
            accessibilityLabel="Reservar clase"
            accessibilityRole="button"
          >
            {reservando ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textInverse} />
                <Text style={styles.ctaText}>Reservar clase</Text>
              </>
            )}
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

// ─── Sub-componente: fila de detalle ──────────────────────────────────────────

function DetailRow({
  icon, label, value, capitalize, last,
}: {
  icon: string; label: string; value: string; capitalize?: boolean; last?: boolean;
}) {
  return (
    <View style={[detailStyles.row, !last && detailStyles.rowBorder]}>
      <View style={detailStyles.iconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.textMuted} />
      </View>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, capitalize && { textTransform: 'capitalize' }]}>
        {value}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  label: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  value: {
    ...Typography.body, color: Colors.textPrimary,
    fontWeight: '500', flexShrink: 1, textAlign: 'right',
  },
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatFecha(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background, gap: Spacing.md,
  },
  errorText: { ...Typography.h3, color: Colors.textSecondary },
  backCta: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  backCtaText: { ...Typography.body, color: Colors.textInverse, fontWeight: '600' },

  // Hero
  hero: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  backCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  backLabel: { ...Typography.body, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroContent: { gap: 4, marginBottom: Spacing.md },
  heroEmoji: { fontSize: 36, marginBottom: 4 },
  heroDisciplina: { fontSize: 28, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  heroHorario: { ...Typography.h3, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroFecha: { ...Typography.body, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: Radius.full, alignSelf: 'flex-start',
  },
  heroBadgeText: { ...Typography.caption, fontWeight: '700' },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  cardInfo: { backgroundColor: Colors.infoLight, borderColor: Colors.padel + '40' },
  cardInfoRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  cardInfoText: { ...Typography.bodySmall, color: Colors.info, flex: 1, lineHeight: 18 },
  cardLabel: {
    ...Typography.caption, color: Colors.textMuted,
    fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm,
  },
  ocupacionRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.sm },
  ocupacionPct: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  ocupacionDetail: { ...Typography.body, color: Colors.textSecondary },
  barTrack: { height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.full },
  listaEsperaNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: Spacing.md, padding: Spacing.sm,
    backgroundColor: Colors.warningLight, borderRadius: Radius.md,
  },
  listaEsperaText: { ...Typography.caption, color: Colors.warning, flex: 1, lineHeight: 16 },

  // Sticky CTA
  stickyBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },

  // Botón primario (reservar)
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  // Variante lista de espera (amarillo/warning)
  ctaButtonLista: {
    backgroundColor: Colors.warning,
    shadowColor: Colors.warning,
  },
  ctaButtonLoading: { opacity: 0.7, shadowOpacity: 0 },
  ctaText: { ...Typography.body, fontWeight: '700', color: Colors.textInverse, fontSize: 16 },

  // Info estática: "en lista" y "suspendida"
  ctaEnLista: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.warning + '50',
  },
  ctaEnListaText: { ...Typography.body, color: Colors.warning, fontWeight: '600' },
  ctaInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 16,
  },
  ctaInfoText: { ...Typography.body, color: Colors.textMuted, fontWeight: '500' },
});
