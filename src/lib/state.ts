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

function safeGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
  emit();
}

function safeClear(key: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
  emit();
}

export const sessionState = {
  getIntake: () => safeGet<Intake>(KEY_INTAKE),
  setIntake: (v: Intake) => safeSet(KEY_INTAKE, v),
  getFeasibility: () => safeGet<Feasibility>(KEY_FEASIBILITY),
  setFeasibility: (v: Feasibility) => safeSet(KEY_FEASIBILITY, v),
  getPlan: () => safeGet<WizardPlan>(KEY_PLAN),
  setPlan: (v: WizardPlan) => safeSet(KEY_PLAN, v),
  clearAll: () => {
    safeClear(KEY_INTAKE);
    safeClear(KEY_FEASIBILITY);
    safeClear(KEY_PLAN);
  },
};

/**
 * useSyncExternalStore-based hook so we never call setState inside an effect.
 * Returns `undefined` during SSR / before hydration; resolves to the stored
 * value (or `null` if missing) after first paint on the client.
 */
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
