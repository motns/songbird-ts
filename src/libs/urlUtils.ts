import { RouteConcat } from "../types/urlUtils";
import { StripStringPrefix, StripStringSuffix } from "../types/global";

export function routePatternToOpenAPIPath(rp: string): string {
  // Strips out "<type>" identifiers
  const withoutType = rp.replace(/<w+>/gi, "")
  return withoutType.replace(/(:(w+))/, "{$2}")
}

export function stripStringPrefix<In extends string, Prefix extends string>(input: In, prefix: Prefix): StripStringPrefix<In, Prefix> {
  const out = input.at(0) === prefix ? input.substring(1) : input
  return out as StripStringPrefix<In, Prefix>
}

export function stripStringSuffix<In extends string, Suffix extends string>(input: In, suffix: Suffix): StripStringSuffix<In, Suffix> {
  const out = input.at(-1) === suffix ? input.substring(0, -1) : input
  return out as StripStringSuffix<In, Suffix>
}

export function routeConcat<A extends string, B extends string>(a: string, b: string): RouteConcat<A, B> {
  return `${stripStringSuffix(a, "/")}/${stripStringPrefix(b, "/")}` as RouteConcat<A, B>
}