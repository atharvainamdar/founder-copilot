"use client";

import { useSyncExternalStore } from "react";
import type { Feasibility, Intake, WizardPlan } from "@/lib/schemas";

const KEY_INTAKE = "fc:intake";
const KEY_FEASIBILITY = "fc:feasibility";
const KEY_PLAN = "fc:plan";

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", cb);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", cb);
    }
  };
}

const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function getCachedSnapshot<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) {
    return cached.value as T | null;
  }
  let value: T | null = null;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = null;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(value);
  window.sessionStorage.setItem(key, raw);
  snapshotCache.set(key, { raw, value });
  emit();
}

function safeClear(key: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
  snapshotCache.set(key, { raw: null, value: null });
  emit();
}

export const sessionState = {
  getIntake: () => getCachedSnapshot<Intake>(KEY_INTAKE),
  setIntake: (v: Intake) => safeSet(KEY_INTAKE, v),
  getFeasibility: () => getCachedSnapshot<Feasibility>(KEY_FEASIBILITY),
  setFeasibility: (v: Feasibility) => safeSet(KEY_FEASIBILITY, v),
  getPlan: () => getCachedSnapshot<WizardPlan>(KEY_PLAN),
  setPlan: (v: WizardPlan) => safeSet(KEY_PLAN, v),
  clearAll: () => {
    safeClear(KEY_INTAKE);
    safeClear(KEY_FEASIBILITY);
    safeClear(KEY_PLAN);
  },
};

function useSessionValue<T>(reader: () => T | null): T | null | undefined {
  return useSyncExternalStore(
    subscribe,
    reader,
    () => undefined as T | null | undefined,
  );
}

export const useIntake = () => useSessionValue(() => sessionState.getIntake());
export const useFeasibility = () =>
  useSessionValue(() => sessionState.getFeasibility());
export const usePlan = () => useSessionValue(() => sessionState.getPlan());
