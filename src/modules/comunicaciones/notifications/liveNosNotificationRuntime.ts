export type LiveNosNotificationKind =
  | "nuevo"
  | "gestion"
  | "cande_transfer"
  | "internal";

export type LiveNosRuntimeNotification = {
  id: string;
  kind: LiveNosNotificationKind;
  title: string;
  body: string;
  conversationId?: string;
  messageId?: string;
};

const STORAGE_KEY = "nostur:livenos:processed-notifications";
const CHANNEL_NAME = "nostur:livenos:notifications";
const MAX_PROCESSED = 250;
const PROCESSED_TTL_MS = 12 * 60 * 60 * 1000;
const TAB_HEARTBEAT_MS = 2500;
const TAB_STALE_MS = 7000;

type ProcessedEntry = {
  id: string;
  createdAt: number;
};

type TabState = {
  id: string;
  visible: boolean;
  focused: boolean;
  updatedAt: number;
};

type RuntimeMessage =
  | {
      type: "tab-state";
      state: TabState;
    }
  | {
      type: "processed";
      id: string;
      createdAt: number;
    };

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readProcessed(): ProcessedEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    const cutoff = Date.now() - PROCESSED_TTL_MS;

    return parsed
      .filter(
        (entry): entry is ProcessedEntry =>
          Boolean(entry) &&
          typeof entry.id === "string" &&
          typeof entry.createdAt === "number" &&
          entry.createdAt >= cutoff
      )
      .slice(-MAX_PROCESSED);
  } catch {
    return [];
  }
}

function writeProcessed(entries: ProcessedEntry[]) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(-MAX_PROCESSED))
    );
  } catch {
    // No bloquear notificaciones por almacenamiento privado o lleno.
  }
}

class LiveNosNotificationRuntime {
  private readonly tabId = createId();

  private readonly tabs = new Map<string, TabState>();

  private readonly processed = new Map<string, number>();

  private channel: BroadcastChannel | null = null;

  private heartbeatTimer: number | null = null;

  private audioContext: AudioContext | null = null;

  private audioUnlocked = false;

  private initialized = false;

  private readonly publishCurrentTabState = () => {
    this.publishTabState();
  };

  private readonly unlockAudioFromInteraction = () => {
    void this.unlockAudio();
  };

  private serviceWorkerRegistration:
    | ServiceWorkerRegistration
    | null = null;

  private readonly handleServiceWorkerMessage = (
    event: MessageEvent
  ) => {
    const message = event.data;

    if (
      message?.type !==
      "nostur:open-livenos-conversation"
    ) {
      return;
    }

    this.openConversation(
      message.conversationId,
      message.messageId
    );
  };

  initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    void this.initializeServiceWorker();
    this.openConversationFromUrl();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "message",
        this.handleServiceWorkerMessage
      );
    }

    for (const entry of readProcessed()) {
      this.processed.set(entry.id, entry.createdAt);
    }

    if ("BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);

      this.channel.onmessage = (
        event: MessageEvent<RuntimeMessage>
      ) => {
        const message = event.data;

        if (message?.type === "tab-state") {
          this.tabs.set(message.state.id, message.state);
          return;
        }

        if (message?.type === "processed") {
          this.processed.set(message.id, message.createdAt);
          this.persistProcessed();
        }
      };
    }

    window.addEventListener(
      "focus",
      this.publishCurrentTabState
    );

    window.addEventListener(
      "blur",
      this.publishCurrentTabState
    );

    document.addEventListener(
      "visibilitychange",
      this.publishCurrentTabState
    );

    window.addEventListener(
      "pointerdown",
      this.unlockAudioFromInteraction,
      {
        passive: true
      }
    );

    window.addEventListener(
      "keydown",
      this.unlockAudioFromInteraction
    );

    this.publishTabState();

    this.heartbeatTimer = window.setInterval(
      () => this.publishTabState(),
      TAB_HEARTBEAT_MS
    );
  }

  destroy() {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.channel?.close();
    this.channel = null;
    this.tabs.clear();

    if (this.audioContext) {
      void this.audioContext.close().catch(() => {
        // No bloquear el desmontaje si el navegador ya cerró el contexto.
      });

      this.audioContext = null;
      this.audioUnlocked = false;
    }

    window.removeEventListener(
      "focus",
      this.publishCurrentTabState
    );

    window.removeEventListener(
      "blur",
      this.publishCurrentTabState
    );

    document.removeEventListener(
      "visibilitychange",
      this.publishCurrentTabState
    );

    window.removeEventListener(
      "pointerdown",
      this.unlockAudioFromInteraction
    );

    window.removeEventListener(
      "keydown",
      this.unlockAudioFromInteraction
    );

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.removeEventListener(
        "message",
        this.handleServiceWorkerMessage
      );
    }

    this.initialized = false;
  }

  isPrimaryTab(): boolean {
    this.pruneStaleTabs();

    const availableTabs = Array.from(
      this.tabs.values()
    ).sort((left, right) =>
      left.id.localeCompare(right.id)
    );

    if (availableTabs.length === 0) {
      return true;
    }

    const focusedTabs = availableTabs.filter(
      (tab) => tab.focused
    );

    const visibleTabs = availableTabs.filter(
      (tab) => tab.visible
    );

    const winner =
      focusedTabs[0] ||
      visibleTabs[0] ||
      availableTabs[0];

    return winner.id === this.tabId;
  }

  hasProcessed(id: string): boolean {
    this.pruneProcessed();
    return this.processed.has(id);
  }

  markProcessed(id: string): boolean {
    if (!id || this.hasProcessed(id)) {
      return false;
    }

    const createdAt = Date.now();

    this.processed.set(id, createdAt);
    this.persistProcessed();

    this.channel?.postMessage({
      type: "processed",
      id,
      createdAt
    } satisfies RuntimeMessage);

    return true;
  }

  async playSound(
    kind: LiveNosNotificationKind
  ): Promise<void> {
    if (!this.isPrimaryTab()) {
      return;
    }

    const context = this.getAudioContext();

    if (!context) {
      return;
    }

    try {
      if (context.state === "suspended") {
        await context.resume();
      }

      this.audioUnlocked = context.state === "running";
    } catch {
      return;
    }

    if (!this.audioUnlocked) {
      return;
    }

    const sequence = this.getToneSequence(kind);

    let offset = 0;

    for (const tone of sequence) {
      this.scheduleTone(
        context,
        offset,
        tone.frequency,
        tone.duration,
        tone.volume,
        tone.type
      );

      offset += tone.duration + tone.gap;
    }
  }

  async showSystemNotification(
    payload: LiveNosRuntimeNotification
  ): Promise<boolean> {
    if (!this.isPrimaryTab()) {
      return false;
    }

    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission !== "granted") {
      return false;
    }

    try {
      const registration =
        await this.getServiceWorkerRegistration();

      if (registration) {
        const existingNotifications =
          await registration.getNotifications({
            tag: payload.id
          });

        for (const existingNotification of existingNotifications) {
          existingNotification.close();
        }

        await registration.showNotification(
          payload.title,
          {
            body: payload.body,
            icon:
              "/brand/NOSSTOUR_favicon_256_transparente.png",
            badge:
              "/brand/NOSSTOUR_favicon_256_transparente.png",
            tag: payload.id,
            silent: true,
            data: {
              conversationId:
                payload.conversationId,
              messageId:
                payload.messageId
            }
          }
        );

        return true;
      }

      const notification = new Notification(
        payload.title,
        {
          body: payload.body,
          icon:
            "/brand/NOSSTOUR_favicon_256_transparente.png",
          badge:
            "/brand/NOSSTOUR_favicon_256_transparente.png",
          tag: payload.id,
          silent: true,
          data: {
            conversationId:
              payload.conversationId,
            messageId:
              payload.messageId
          }
        }
      );

      notification.onclick = () => {
        window.focus();

        this.openConversation(
          payload.conversationId,
          payload.messageId
        );

        notification.close();
      };

      return true;
    } catch {
      return false;
    }
  }

  async requestPermission(): Promise<
    NotificationPermission | "unsupported"
  > {
    if (!("Notification" in window)) {
      return "unsupported";
    }

    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {
      await this.initializeServiceWorker();
    }

    return permission;
  }

  openConversation(
    conversationId?: string,
    messageId?: string
  ) {
    if (!conversationId || conversationId === "test") {
      return;
    }

    window.localStorage.setItem(
      "nostur_open_livenos_conversation_id",
      conversationId
    );

    if (messageId) {
      window.localStorage.setItem(
        "nostur_open_livenos_message_id",
        messageId
      );
    }

    window.dispatchEvent(
      new CustomEvent("nostur:open-internal", {
        detail: {
          appId: "livenos",
          moduleId: "livenos",
          url: "internal://livenos",
          title: "LiveNos"
        }
      })
    );

    window.dispatchEvent(
      new CustomEvent("nostur:open-livenos-conversation", {
        detail: {
          conversationId,
          messageId
        }
      })
    );
  }

  private async initializeServiceWorker() {
    if (
      !("serviceWorker" in navigator) ||
      !window.isSecureContext
    ) {
      return;
    }

    try {
      await navigator.serviceWorker.register(
        "/notification-sw.js",
        {
          scope: "/"
        }
      );

      this.serviceWorkerRegistration =
        await navigator.serviceWorker.ready;
    } catch {
      this.serviceWorkerRegistration = null;
    }
  }

  private async getServiceWorkerRegistration():
    Promise<ServiceWorkerRegistration | null> {
    if (
      !("serviceWorker" in navigator) ||
      !window.isSecureContext
    ) {
      return null;
    }

    if (
      this.serviceWorkerRegistration?.active
    ) {
      return this.serviceWorkerRegistration;
    }

    await this.initializeServiceWorker();

    if (
      this.serviceWorkerRegistration?.active
    ) {
      return this.serviceWorkerRegistration;
    }

    try {
      this.serviceWorkerRegistration =
        await navigator.serviceWorker.ready;

      return this.serviceWorkerRegistration;
    } catch {
      return null;
    }
  }

  private openConversationFromUrl() {
    const url = new URL(window.location.href);

    const conversationId =
      url.searchParams.get(
        "livenosConversation"
      ) || "";

    const messageId =
      url.searchParams.get(
        "livenosMessage"
      ) || "";

    if (!conversationId) {
      return;
    }

    url.searchParams.delete(
      "livenosConversation"
    );

    url.searchParams.delete(
      "livenosMessage"
    );

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );

    window.setTimeout(() => {
      this.openConversation(
        conversationId,
        messageId || undefined
      );
    }, 500);
  }

  private publishTabState() {
    const state: TabState = {
      id: this.tabId,
      visible: document.visibilityState === "visible",
      focused: document.hasFocus(),
      updatedAt: Date.now()
    };

    this.tabs.set(this.tabId, state);

    this.channel?.postMessage({
      type: "tab-state",
      state
    } satisfies RuntimeMessage);
  }

  private pruneStaleTabs() {
    const cutoff = Date.now() - TAB_STALE_MS;

    for (const [id, state] of this.tabs.entries()) {
      if (state.updatedAt < cutoff) {
        this.tabs.delete(id);
      }
    }
  }

  private pruneProcessed() {
    const cutoff = Date.now() - PROCESSED_TTL_MS;

    for (const [id, createdAt] of this.processed.entries()) {
      if (createdAt < cutoff) {
        this.processed.delete(id);
      }
    }
  }

  private persistProcessed() {
    this.pruneProcessed();

    writeProcessed(
      Array.from(this.processed.entries()).map(
        ([id, createdAt]) => ({
          id,
          createdAt
        })
      )
    );
  }

  private getAudioContext(): AudioContext | null {
    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    this.audioContext = new AudioContextClass();

    return this.audioContext;
  }

  private async unlockAudio() {
    const context = this.getAudioContext();

    if (!context) {
      return;
    }

    try {
      if (context.state === "suspended") {
        await context.resume();
      }

      this.audioUnlocked = context.state === "running";
    } catch {
      this.audioUnlocked = false;
    }
  }

  private scheduleTone(
    context: AudioContext,
    offsetMs: number,
    frequency: number,
    durationMs: number,
    volume: number,
    type: OscillatorType
  ) {
    const startAt = context.currentTime + offsetMs / 1000;
    const endAt = startAt + durationMs / 1000;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      startAt
    );

    gain.gain.setValueAtTime(
      0.0001,
      startAt
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      startAt + 0.012
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      endAt
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(endAt + 0.03);
  }

  private getToneSequence(
    kind: LiveNosNotificationKind
  ) {
    if (kind === "cande_transfer") {
      return [
        {
          frequency: 660,
          duration: 120,
          gap: 50,
          volume: 0.24,
          type: "triangle" as OscillatorType
        },
        {
          frequency: 880,
          duration: 150,
          gap: 70,
          volume: 0.28,
          type: "sine" as OscillatorType
        },
        {
          frequency: 740,
          duration: 180,
          gap: 0,
          volume: 0.24,
          type: "triangle" as OscillatorType
        }
      ];
    }

    if (kind === "nuevo") {
      return [
        {
          frequency: 720,
          duration: 120,
          gap: 50,
          volume: 0.26,
          type: "triangle" as OscillatorType
        },
        {
          frequency: 920,
          duration: 140,
          gap: 60,
          volume: 0.3,
          type: "sine" as OscillatorType
        },
        {
          frequency: 760,
          duration: 170,
          gap: 0,
          volume: 0.25,
          type: "triangle" as OscillatorType
        }
      ];
    }

    if (kind === "internal") {
      return [
        {
          frequency: 620,
          duration: 110,
          gap: 50,
          volume: 0.2,
          type: "triangle" as OscillatorType
        },
        {
          frequency: 780,
          duration: 130,
          gap: 0,
          volume: 0.22,
          type: "sine" as OscillatorType
        }
      ];
    }

    return [
      {
        frequency: 680,
        duration: 110,
        gap: 55,
        volume: 0.22,
        type: "triangle" as OscillatorType
      },
      {
        frequency: 840,
        duration: 135,
        gap: 0,
        volume: 0.21,
        type: "sine" as OscillatorType
      }
    ];
  }
}

export const liveNosNotificationRuntime =
  new LiveNosNotificationRuntime();
