// src/modules/comunicaciones/notifications/liveNosNotificationTypes.ts

export type ConversationLite = {
  id: string;
  wa_phone: string | null;
  titulo: string | null;
  subject: string | null;
  estado_gestion: string | null;
  inbox: string | null;
  assigned_to: string | null;
  tomada_by: string | null;
  deleted_at: string | null;
};

export type OpportunityLite = {
  id: string;
  conversacion_id: string | null;
  cande_handoff_requested_at: string | null;
  estado_id?: string | null;
  assigned_to?: string | null;
  score?: number | null;
  datos?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type NotificationProfileLite = {
  id: string;
  rol: string | null;
  activo: boolean | null;
  is_support_user?: boolean | null;
  is_super_admin?: boolean | null;
};

export type LiveNosNotificationPreferences = {
  user_id: string;
  sound_enabled: boolean;
  system_notification_enabled: boolean;
  toast_enabled: boolean;
  cande_enabled: boolean;
  internal_messages_enabled: boolean;
  new_conversations_enabled: boolean;
  budgets_enabled: boolean;
  opportunities_enabled: boolean;
  do_not_disturb_enabled: boolean;
  do_not_disturb_from: string | null;
  do_not_disturb_until: string | null;
};

export type IncomingMessagePayload = {
  id: string;
  conversacion_id: string;
  direction: string;
  sender_kind: string | null;
  type: string | null;
  text: string | null;
  created_at: string | null;
  wa_timestamp: string | null;
};

export type InternalNotePayload = {
  id: string;
  conversacion_id: string;
  autor_id: string | null;
  contenido: string | null;
  tipo: string | null;
  created_at: string | null;
};

export type NotificationContext = {
  conversation: ConversationLite | null;
  opportunity: OpportunityLite | null;
};

export type OpportunityRealtimePayload = {
  old: OpportunityLite | null;
  next: OpportunityLite;
  eventType: "INSERT" | "UPDATE";
};

export type PipelineStateLite = {
  id: string;
  nombre: string | null;
  es_final: boolean | null;
  resultado: string | null;
};

export type PresupuestoRealtimeRow = {
  id: string;
  numero: number | string | null;
  nombre: string | null;
  contacto_nombre: string | null;
  destino: string | null;
  estado: string | null;
  creado_por: string | null;
  vendedor_id: string | null;
  activo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PresupuestoRealtimePayload = {
  old: PresupuestoRealtimeRow | null;
  next: PresupuestoRealtimeRow;
  eventType: "INSERT" | "UPDATE";
};

export type VisibleToast = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  conversationId?: string;
  messageId?: string;
  createdAt: string;
};
