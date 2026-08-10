import {
  Clock3,
  ExternalLink,
  Loader2,
  MessageCircleMore,
  RefreshCcw,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import {
  DocumentRenderer,
} from "../DocumentRenderer";

import {
  usePresupuestoLiveNosStatus,
} from "../../hooks/usePresupuestoLiveNosStatus";

import {
  createDocumentPdfFile,
} from "../../utils/documentExport";

import {
  sendPresupuestoToWhatsapp,
} from "../../services/presupuestoWhatsappService";

import type {
  PresupuestoDocument,
} from "../../types/editor.types";

type PresupuestoLiveNosActionsProps = {
  document: PresupuestoDocument;
};

const formatWindowRemaining = (
  expiresAt: string | null,
): string => {
  if (!expiresAt) {
    return "Ventana cerrada";
  }

  const difference =
    new Date(expiresAt).getTime() -
    Date.now();

  if (difference <= 0) {
    return "Ventana cerrada";
  }

  const hours = Math.floor(
    difference / 3_600_000,
  );

  const minutes = Math.floor(
    (
      difference %
      3_600_000
    ) / 60_000,
  );

  if (hours <= 0) {
    return `Abierta · ${minutes}m`;
  }

  return `Abierta · ${hours}h ${minutes}m`;
};

export function PresupuestoLiveNosActions({
  document,
}: PresupuestoLiveNosActionsProps) {
  const exportContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    sending,
    setSending,
  ] = useState(false);

  const phone =
    document.contacto.telefono;

  const {
    loading,
    error,
    result,
    refresh,
  } = usePresupuestoLiveNosStatus(
    phone,
    {
      enabled:
        phone.trim().length > 0,
    },
  );

  const preferredConversation =
    result?.openWindowMatches[0] ??
    result?.matches[0] ??
    null;

  const hasConversation =
    Boolean(
      result?.hasConversation,
    );

  const hasOpenWindow =
    Boolean(
      result?.hasOpenWindow,
    );

  const dispatchOpenLiveNos = (
    openTemplateModal: boolean,
  ) => {
    if (!preferredConversation) {
      return;
    }

    try {
      window.localStorage.setItem(
        "nostur_open_livenos_conversation_id",
        preferredConversation.conversationId,
      );

      window.localStorage.setItem(
        "nostur_livenos_open_inbox",
        "en_gestion",
      );

      if (openTemplateModal) {
        window.localStorage.setItem(
          "nostur_livenos_open_template_modal",
          "1",
        );
      } else {
        window.localStorage.removeItem(
          "nostur_livenos_open_template_modal",
        );
      }
    } catch {
      // La navegación continúa mediante eventos.
    }

    window.dispatchEvent(
      new CustomEvent(
        "nostur:open-internal",
        {
          detail: {
            moduleId: "livenos",
            appId: "livenos",
            route: "livenos",
            url: "internal://livenos",
            title: "LiveNos",
          },
        },
      ),
    );

    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(
          "nostur:open-livenos-conversation",
          {
            detail: {
              conversationId:
                preferredConversation.conversationId,

              inbox:
                "en_gestion",

              openTemplateModal,

              phone:
                result?.normalizedPhone ??
                phone,

              nombre:
                document.contacto.nombre,
            },
          },
        ),
      );
    }, 250);
  };

  const handleOpenLiveNos = () => {
    dispatchOpenLiveNos(
      !hasOpenWindow,
    );
  };

  const handleWhatsapp =
    async () => {
      if (
        !hasOpenWindow ||
        !preferredConversation ||
        !exportContainerRef.current ||
        sending
      ) {
        return;
      }

      const shouldSend =
        window.confirm(
          `¿Enviar “${document.name}” por WhatsApp a ${document.contacto.nombre}?`,
        );

      if (!shouldSend) {
        return;
      }

      setSending(true);

      try {
        const pdfFile =
          await createDocumentPdfFile(
            document,
            exportContainerRef.current,
          );

        await sendPresupuestoToWhatsapp({
          conversation:
            preferredConversation,

          file:
            pdfFile,

          caption:
            `Hola ${document.contacto.nombre}, te compartimos tu presupuesto.`,
        });

        window.alert(
          "Presupuesto enviado correctamente por WhatsApp.",
        );

        await refresh();
      } catch (
        sendError
      ) {
        const message =
          sendError instanceof Error
            ? sendError.message
            : "No se pudo enviar el presupuesto.";

        window.alert(message);
      } finally {
        setSending(false);
      }
    };

  let content;

  if (!phone.trim()) {
    content = (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-2 text-xs font-medium text-slate-500">
        <MessageCircleMore
          size={14}
        />

        Sin teléfono
      </span>
    );
  } else if (loading) {
    content = (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-2 text-xs font-medium text-slate-500">
        <Loader2
          size={14}
          className="animate-spin"
        />

        Consultando LiveNos
      </span>
    );
  } else if (error) {
    content = (
      <button
        type="button"
        onClick={() =>
          void refresh()
        }
        title={error}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-50 px-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
      >
        <RefreshCcw
          size={14}
        />

        Reintentar LiveNos
      </button>
    );
  } else if (!hasConversation) {
    const handleStartConversation = () => {
      try {
        window.localStorage.setItem(
          "nostur_livenos_open_new_conversation",
          "1",
        );

        window.localStorage.setItem(
          "nostur_livenos_new_conversation_phone",
          result?.normalizedPhone ||
            phone,
        );

        window.localStorage.setItem(
          "nostur_livenos_new_conversation_name",
          document.contacto.nombre,
        );
      } catch {
        // La navegación igualmente continúa.
      }

      window.dispatchEvent(
        new CustomEvent(
          "nostur:open-internal",
          {
            detail: {
              moduleId: "livenos",
              appId: "livenos",
              route: "livenos",
              url: "internal://livenos",
              title: "LiveNos",
            },
          },
        ),
      );

      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(
            "nostur:open-livenos-conversation",
            {
              detail: {
                openNewConversation: true,
                open_new_conversation: true,

                phone:
                  result?.normalizedPhone ||
                  phone,

                telefono:
                  result?.normalizedPhone ||
                  phone,

                nombre:
                  document.contacto.nombre,

                name:
                  document.contacto.nombre,

                inbox:
                  "en_gestion",
              },
            },
          ),
        );
      }, 250);
    };

    content = (
      <div className="flex flex-wrap items-center gap-1">
        <span
          title="No existe una conversación activa para este teléfono"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-2 text-xs font-medium text-slate-500"
        >
          <span className="h-2 w-2 rounded-full bg-slate-400" />

          Sin conversación
        </span>

        <button
          type="button"
          onClick={
            handleStartConversation
          }
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          title="Abrir LiveNos para iniciar una conversación"
        >
          <ExternalLink
            size={14}
          />

          Iniciar chat
        </button>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-wrap items-center gap-1">
        <span
          title={
            hasOpenWindow
              ? "La ventana permite enviar mensajes libres y archivos."
              : "La conversación existe, pero requiere un template aprobado por Meta."
          }
          className={[
            "inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold",
            hasOpenWindow
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          <span
            className={[
              "h-2 w-2 rounded-full",
              hasOpenWindow
                ? "bg-emerald-500"
                : "bg-red-500",
            ].join(" ")}
          />

          {hasOpenWindow
            ? formatWindowRemaining(
                preferredConversation
                  ?.windowExpiresAt ??
                  null,
              )
            : "Ventana cerrada"}
        </span>

        <button
          type="button"
          onClick={
            handleOpenLiveNos
          }
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          title={
            hasOpenWindow
              ? "Abrir la conversación en LiveNos"
              : "Abrir LiveNos y seleccionar un template"
          }
        >
          <ExternalLink
            size={14}
          />

          LiveNos
        </button>

        <button
          type="button"
          disabled={
            !hasOpenWindow ||
            sending
          }
          onClick={() =>
            void handleWhatsapp()
          }
          title={
            hasOpenWindow
              ? "Generar y enviar el PDF por WhatsApp"
              : "La ventana de 24 horas está cerrada"
          }
          className={[
            "flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition",
            hasOpenWindow
              ? "text-emerald-700 hover:bg-emerald-50"
              : "cursor-not-allowed text-slate-300",
          ].join(" ")}
        >
          {sending ? (
            <Loader2
              size={14}
              className="animate-spin"
            />
          ) : (
            <MessageCircleMore
              size={14}
            />
          )}

          {sending
            ? "Enviando..."
            : "WhatsApp"}
        </button>

        {!hasOpenWindow ? (
          <span
            title="Al abrir LiveNos se mostrará el selector de templates aprobados."
            className="hidden items-center gap-1 text-[11px] text-slate-400 xl:inline-flex"
          >
            <Clock3 size={12} />
            Requiere template
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {content}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-100000px] top-0 z-[-1]"
      >
        <div
          ref={
            exportContainerRef
          }
          className="bg-white"
        >
          <DocumentRenderer
            document={document}
            scale={1}
            pageGap={0}
          />
        </div>
      </div>
    </>
  );
}
