import type { ComplexTypeValidationErrors } from "../types/index.js";
import { keys } from "remeda";

function mergeProperties(
  a: Record<string, ComplexTypeValidationErrors> | undefined,
  b: Record<string, ComplexTypeValidationErrors> | undefined,
): Record<string, ComplexTypeValidationErrors> {
  const both = Object.fromEntries(
    keys(a ?? {})
      .filter((k) => k in (b ?? {}))
      .map((k) => [k, a![k] && b![k] && mergeComplexTypeValidationErrors(a![k], b![k])]),
  ) as Record<string, ComplexTypeValidationErrors>;
  return {
    ...a,
    ...b,
    ...both,
  };
}

function mergeItems(
  a: Record<number, ComplexTypeValidationErrors> | undefined,
  b: Record<number, ComplexTypeValidationErrors> | undefined,
): Record<number, ComplexTypeValidationErrors> {
  const both = Object.fromEntries(
    keys(a ?? {})
      .filter((k) => k in (b ?? {}))
      .map((k) => [k, a![k] && b![k] && mergeComplexTypeValidationErrors(a![k], b![k])]),
  ) as Record<number, ComplexTypeValidationErrors>;
  return {
    ...a,
    ...b,
    ...both,
  };
}

export function mergeComplexTypeValidationErrors(
  a: ComplexTypeValidationErrors,
  b: ComplexTypeValidationErrors,
): ComplexTypeValidationErrors {
  if (!b) return a;
  return {
    ...((a.properties || b.properties) && {
      properties: mergeProperties(a.properties, b.properties),
    }),
    ...((a.items || b.items) && { items: mergeItems(a.items, b.items) }),
    ...((a.errors || b.errors) && { errors: [...(a.errors ?? []), ...(b.errors ?? [])] }),
  };
}
