import type { MergeArrayOfObjects, ParsePrimitiveTypeString, StripStringPrefix, StripStringSuffix } from "./global.js";


/**
 * Takes an endpoint path and extracts any path parameters as a Tuple.
 * It recognises Express-style path parameters: `/users/:user_id`.
 * It also supports adding a type in angle brackets: `/users/:user_id<number>`.
 */
export type ExtractRouteParamsAsList<Route> =
  Route extends string
    ? Route extends `${infer _Before}/:${infer Token}/${infer Rest}`
      ? [Token, ...ExtractRouteParamsAsList<Rest>]
      : Route extends `${infer _Before}/:${infer Token}`
        ? [Token]
        : []
    : never

/**
 * Helper type used to parse a path parameter string extracted from a URL via `ExtractRouteParamsAsList`
 * and turn it into an object with the param name and primitive type for the parameter.
 * Types can be provided in the `:token<type>` format; if a type is not provided, it defaults to `string`.
 */
export type RouteParamToPrimitiveTypeObject<Param> =
  Param extends string
    ? Param extends ""
      ? never
      : Param extends `${infer Name}<${infer TypeStr}>`
        ? { key: Name, value: ParsePrimitiveTypeString<TypeStr> }
        : { key: Param, value: string }
    : never

/**
 * Helper type used to turn a path parameter token extracted from a URL into
 * a `{ name: type }` object.
 */
export type RouteParamToTypeObject<Param extends string> =
  [RouteParamToPrimitiveTypeObject<Param>] extends [never]
    ? never
    : RouteParamToPrimitiveTypeObject<Param> extends {
        key: infer K extends string,
        value: infer V
      } ? {
        [Key in K]: V
      } : never

/**
 * Helper type used to turn a list of path parameter tokens extracted from a URL
 * into a list of `{ name: type }` objects for further processing.
 */
export type RouteParamListToTypeObjectList<T extends string[]> = {
  [K in keyof T]: RouteParamToTypeObject<T[K]>
}

/**
 * Used to generate the output shape for path parameters in a given URL path
 */
export type RouteParamOutput<Route extends string> =
  MergeArrayOfObjects<
    RouteParamListToTypeObjectList<
      ExtractRouteParamsAsList<Route>
    >
  >

/**
 * Used to calculate the output shape for validated path parameters for a given URL path.
 * Returns an empty object if the path contains no parameters.
 */
export type RouteParamOutputType<Route extends string> =
  ExtractRouteParamsAsList<Route> extends []
    ? Record<string, never>
    : RouteParamOutput<Route>

/**
 * Used to join two Path segments, gracefully handling preceding/trailing slashes
 */
export type RouteConcat<A extends string, B extends string> =
  `${StripStringSuffix<A, "/">}/${StripStringPrefix<B, "/">}`