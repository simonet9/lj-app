import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Evento A: Notificación de lugar disponible en Lista de Espera ────────────
//
// Disparado por: Database Webhook → AFTER DELETE ON reservas
// O bien: llamada directa desde la Edge Function cancelar_reserva_unificada.
//
// Flujo:
//  1. Recibe clase_id (la clase cuyo cupo se liberó)
//  2. Verifica que cupo_disponible > 0 para evitar falsos disparos
//  3. Busca al primer usuario en lista_espera (posicion = 1)
//  4. Llama a send-push-notification para ese usuario
//  5. Marca la fila en lista_espera como 'notificado' + timestamp

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
    });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // ── Parsear payload del webhook ───────────────────────────────────────────
  let payload: { claseId?: string } & Partial<WebhookPayload>;
  try {
    payload = await req.json();
  } catch {
    return error(400, "Invalid JSON");
  }

  // Soporta tanto llamada directa { claseId } como webhook de DB { old_record }
  const claseId: string | undefined =
    payload.claseId ??
    (payload.old_record?.clase_id as string | undefined) ??
    (payload.record?.clase_id as string | undefined);

  if (!claseId) {
    return error(400, "Missing claseId");
  }

  // ── 1. Verificar cupo disponible ──────────────────────────────────────────
  const { data: clase, error: claseErr } = await supabase
    .from("clases")
    .select("id, disciplina, fecha, hora_inicio, cupo_disponible")
    .eq("id", claseId)
    .single();

  if (claseErr || !clase) {
    console.error("[lista-espera] Clase no encontrada:", claseId);
    return error(404, "Clase not found");
  }

  if (clase.cupo_disponible < 1) {
    console.log("[lista-espera] Sin cupo, no se notifica:", claseId);
    return ok({ notified: false, reason: "no_cupo" });
  }

  // ── 2. Buscar primer usuario en lista de espera ───────────────────────────
  const { data: primerEnEspera, error: listaErr } = await supabase
    .from("lista_espera")
    .select("id, socio_id, posicion, notificado_at")
    .eq("clase_id", claseId)
    .eq("posicion", 1)
    .is("notificado_at", null) // Solo si aún no fue notificado
    .maybeSingle();

  if (listaErr) {
    console.error("[lista-espera] Error query lista_espera:", listaErr.message);
    return error(500, "DB error");
  }

  if (!primerEnEspera) {
    console.log("[lista-espera] Lista vacía o ya notificado para clase:", claseId);
    return ok({ notified: false, reason: "lista_vacia_o_notificado" });
  }

  // ── 3. Formatear mensaje ──────────────────────────────────────────────────
  const fechaFormateada = new Date(clase.fecha + "T00:00:00")
    .toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const horaFormateada = clase.hora_inicio?.slice(0, 5) ?? "";
  const disciplinaLabel: Record<string, string> = {
    futbol5: "Fútbol 5", padel: "Pádel", voley: "Vóley", basquet: "Básquet",
  };
  const disciplina = disciplinaLabel[clase.disciplina] ?? clase.disciplina;

  const title = "¡Lugar disponible! 🎉";
  const body =
    `Se liberó un lugar en la clase de ${disciplina} del ${fechaFormateada} a las ${horaFormateada}. Tenés 15 minutos para confirmar.`;

  // ── 4. Enviar push notification ───────────────────────────────────────────
  const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      userIds: [primerEnEspera.socio_id],
      title,
      body,
      data: {
        tipo: "lista_espera",
        claseId,
        action: "abrir_clase",
      },
      priority: "high",
    }),
  });

  if (!sendRes.ok) {
    console.error("[lista-espera] Error calling send-push:", await sendRes.text());
    return error(502, "Error sending push");
  }

  // ── 5. Marcar como notificado (idempotencia + ventana de 15min) ───────────
  const { error: updateErr } = await supabase
    .from("lista_espera")
    .update({ notificado_at: new Date().toISOString() })
    .eq("id", primerEnEspera.id);

  if (updateErr) {
    console.error("[lista-espera] Error updating notificado_at:", updateErr.message);
    // No revertir el push — mejor notificar dos veces que ninguna
  }

  // ── 6. Insertar notificación interna (Realtime para la app) ──────────────
  await supabase.from("notificaciones").insert({
    usuario_id:   primerEnEspera.socio_id,
    titulo:       title,
    cuerpo:       body,
    tipo:         "espera",
    referencia_id: claseId,
  });

  console.log(`[lista-espera] Notificado socio ${primerEnEspera.socio_id} para clase ${claseId}`);
  return ok({ notified: true, socioId: primerEnEspera.socio_id });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

function error(status: number, msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
