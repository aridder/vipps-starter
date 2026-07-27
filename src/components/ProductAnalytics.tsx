"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

const actorKey = "platform.analytics.actor";
const sessionKey = "platform.analytics.session";
const sessionStartedKey = "platform.analytics.session-started";

function getOrCreateId(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  storage.setItem(key, value);
  return value;
}

function sanitizePath(path: string) {
  return path
    .split("/")
    .map((segment) =>
      /^\d+$|^[A-Z0-9]{4,8}$|^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment)
        ? ":id"
        : segment.slice(0, 80),
    )
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
  const anonymousId = getOrCreateId(localStorage, actorKey);
  const sessionId = getOrCreateId(sessionStorage, sessionKey);

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, anonymousId, sessionId, properties }),
    keepalive: true,
  }).catch(() => undefined);
}

export function ProductAnalytics() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    trackClientEvent("technical.web_vital", {
      metric: metric.name,
      rating: metric.rating,
      value: Math.round(metric.value),
      path: sanitizePath(window.location.pathname),
    });
  });

  useEffect(() => {
    const path = sanitizePath(pathname);
    trackClientEvent("app.page_viewed", {
      path,
      deviceType: deviceType(),
    });

    if (!sessionStorage.getItem(sessionStartedKey)) {
      sessionStorage.setItem(sessionStartedKey, "true");
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

    const timers = [30, 120].map((seconds) =>
      window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          trackClientEvent("app.engagement_reached", { path, seconds });
        }
      }, seconds * 1000),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const tagged = target?.closest<HTMLElement>("[data-analytics-event]");
      const taggedEvent = tagged?.dataset.analyticsEvent;
      if (taggedEvent && /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/.test(taggedEvent)) {
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
  }, []);

  return null;
}
