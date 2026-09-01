import type { RouteConcat } from "../types/urlUtils.js";
import type { StripStringPrefix, StripStringSuffix } from "../types/global.js";

export function routePatternToOpenAPIPath(rp: string): string {
  // Wraps the remaining identifiers in curly braces
  return routePatternToExpressRoute(rp).replace(/:(\w+)/g, "{$1}")
}

export function routePatternToExpressRoute(rp: string): string {
  // Strips out "<type>" identifiers
  return rp.replace(/<\w+>/gi, "")
}

export function stripStringPrefix<In extends string, Prefix extends string>(input: In, prefix: Prefix): StripStringPrefix<In, Prefix> {
  const out = input.startsWith(prefix) ? input.substring(prefix.length) : input
  return out as StripStringPrefix<In, Prefix>
}

export function stripStringSuffix<In extends string, Suffix extends string>(input: In, suffix: Suffix): StripStringSuffix<In, Suffix> {
  const out = input.endsWith(suffix) ? input.substring(0, input.length - suffix.length) : input
  return out as StripStringSuffix<In, Suffix>
}

export function routeConcat<A extends string, B extends string>(a: string, b: string): RouteConcat<A, B> {
  return `${stripStringSuffix(a, "/")}/${stripStringPrefix(b, "/")}` as RouteConcat<A, B>
}