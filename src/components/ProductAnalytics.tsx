"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { api } from "@/trpc/react";

type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

const actorKey = "platform.analytics.actor";
const sessionKey = "platform.analytics.session";
const sessionStartedKey = "platform.analytics.session-started";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fallbackIds = new Map<string, string>();
let fallbackSessionStarted = false;
let eventSink:
  | ((name: string, properties: EventProperties) => void)
  | undefined;

function createId() {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (part) => {
      const random = Math.floor(Math.random() * 16);
      const value = part === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}

function getOrCreateId(kind: "local" | "session", key: string) {
  const fallback = fallbackIds.get(key);
  if (fallback) return fallback;

  const value = createId();
  fallbackIds.set(key, value);

  try {
    const storage = kind === "local" ? window.localStorage : window.sessionStorage;
    const existing = storage.getItem(key);
    if (existing && uuidPattern.test(existing)) {
      fallbackIds.set(key, existing);
      return existing;
    }
    storage.setItem(key, value);
  } catch {
    // Analytics is always best effort; blocked storage must not affect the app.
  }

  return value;
}

function hasStartedSession() {
  if (fallbackSessionStarted) return true;
  try {
    if (window.sessionStorage.getItem(sessionStartedKey)) {
      fallbackSessionStarted = true;
      return true;
    }
    window.sessionStorage.setItem(sessionStartedKey, "true");
  } catch {
    // The in-memory flag still prevents duplicate events in this page lifecycle.
  }
  fallbackSessionStarted = true;
  return false;
}

function sanitizePath(path: string) {
  return path
    .split("/")
    .map((segment) => {
      const isNumericId = /^\d+$/.test(segment);
      const isUppercaseCode = /^[A-Z0-9]{4,8}$/.test(segment);
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          segment,
        );
      const isCuid = /^c[a-z0-9]{20,30}$/.test(segment);
      const isLongHex = /^[0-9a-f]{16,}$/i.test(segment);
      return isNumericId || isUppercaseCode || isUuid || isCuid || isLongHex
        ? ":id"
        : segment.slice(0, 80);
    })
    .join("/")
    .slice(0, 256);
}

function deviceType() {
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

export function trackClientEvent(
  name: string,
  properties: EventProperties = {},
) {
  try {
    eventSink?.(name, properties);
  } catch {
    // Telemetry must never alter product behavior.
  }
}

function trackVisibleEngagement(path: string) {
  const thresholds = [30_000, 120_000];
  let thresholdIndex = 0;
  let accumulatedVisibleMs = 0;
  let visibleSince =
    document.visibilityState === "visible" ? performance.now() : undefined;
  let timer: number | undefined;

  const clearTimer = () => {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
  };

  const updateAccumulatedTime = () => {
    if (visibleSince === undefined) return;
    const now = performance.now();
    accumulatedVisibleMs += now - visibleSince;
    visibleSince = now;
  };

  const schedule = () => {
    clearTimer();
    if (
      visibleSince === undefined ||
      thresholdIndex >= thresholds.length
    ) {
      return;
    }

    timer = window.setTimeout(() => {
      updateAccumulatedTime();
      while (
        thresholdIndex < thresholds.length &&
        accumulatedVisibleMs >= thresholds[thresholdIndex]
      ) {
        trackClientEvent("app.engagement_reached", {
          path,
          seconds: thresholds[thresholdIndex] / 1000,
        });
        thresholdIndex += 1;
      }
      schedule();
    }, Math.max(0, thresholds[thresholdIndex] - accumulatedVisibleMs));
  };

  const onVisibilityChange = () => {
    updateAccumulatedTime();
    visibleSince =
      document.visibilityState === "visible" ? performance.now() : undefined;
    schedule();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  schedule();

  return () => {
    clearTimer();
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

export function ProductAnalytics() {
  const pathname = usePathname();
  const enabled = api.analytics.enabled.useQuery(undefined, {
    retry: false,
    staleTime: Infinity,
  });
  const track = api.analytics.track.useMutation();
  const mutate = track.mutate;

  useEffect(() => {
    if (!enabled.data?.enabled) return;

    const sink = (name: string, properties: EventProperties) => {
      const definedProperties = Object.fromEntries(
        Object.entries(properties).filter(([, value]) => value !== undefined),
      ) as Record<string, string | number | boolean | null>;
      mutate({
        name: name as
          | "app.session_started"
          | "app.page_viewed"
          | "app.engagement_reached"
          | "app.navigation_clicked"
          | "technical.web_vital"
          | "technical.client_error"
          | "auth.login_started",
        anonymousId: getOrCreateId("local", actorKey),
        sessionId: getOrCreateId("session", sessionKey),
        properties: definedProperties,
      });
    };
    eventSink = sink;
    return () => {
      if (eventSink === sink) eventSink = undefined;
    };
  }, [enabled.data?.enabled, mutate]);

  useReportWebVitals((metric) => {
    trackClientEvent("technical.web_vital", {
      metric: metric.name,
      rating: metric.rating,
      value:
        metric.name === "CLS"
          ? Math.round(metric.value * 1000) / 1000
          : Math.round(metric.value),
      path: sanitizePath(window.location.pathname),
    });
  });

  useEffect(() => {
    if (!enabled.data?.enabled) return;

    const path = sanitizePath(pathname);
    trackClientEvent("app.page_viewed", {
      path,
      deviceType: deviceType(),
    });

    if (!hasStartedSession()) {
      const query = new URLSearchParams(window.location.search);
      let referrerHost = "direct";
      try {
        if (document.referrer) referrerHost = new URL(document.referrer).host;
      } catch {
        referrerHost = "unknown";
      }

      trackClientEvent("app.session_started", {
        path,
        source: query.get("utm_source")?.slice(0, 100) ?? "direct",
        medium: query.get("utm_medium")?.slice(0, 100) ?? "none",
        campaign: query.get("utm_campaign")?.slice(0, 100) ?? "none",
        referrerHost: referrerHost.slice(0, 100),
        deviceType: deviceType(),
      });
    }

    return trackVisibleEngagement(path);
  }, [enabled.data?.enabled, pathname]);

  useEffect(() => {
    if (!enabled.data?.enabled) return;

    const onClick = (event: MouseEvent) => {
        const target = event.target as Element | null;
        const tagged = target?.closest<HTMLElement>("[data-analytics-event]");
        const taggedEvent = tagged?.dataset.analyticsEvent;
        if (
          taggedEvent &&
          /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/.test(taggedEvent)
        ) {
          trackClientEvent(taggedEvent, {
            label: tagged.dataset.analyticsLabel?.slice(0, 100),
            path: sanitizePath(window.location.pathname),
          });
        }

        const anchor = target?.closest("a");
        const href = anchor?.getAttribute("href");
        if (!href || href.startsWith("#")) return;

        try {
          const destination = new URL(href, window.location.href);
          const internal = destination.origin === window.location.origin;
          trackClientEvent("app.navigation_clicked", {
            fromPath: sanitizePath(window.location.pathname),
            destinationType: internal ? "internal" : "outbound",
            destinationPath: internal
              ? sanitizePath(destination.pathname)
              : destination.host.slice(0, 100),
          });
        } catch {
          return;
        }
    };

    const onError = (event: ErrorEvent) => {
      trackClientEvent("technical.client_error", {
        errorType: event.error?.name ?? "Error",
        path: sanitizePath(window.location.pathname),
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackClientEvent("technical.client_error", {
        errorType: event.reason?.constructor?.name ?? "UnhandledRejection",
        path: sanitizePath(window.location.pathname),
      });
    };

    document.addEventListener("click", onClick);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [enabled.data?.enabled]);

  return null;
}
