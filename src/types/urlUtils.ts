import { MergeArrayOfObjects, ParsePrimitiveTypeString, StripStringPrefix, StripStringSuffix } from "./global";
import { z, ZodNull, ZodObject, ZodType } from "zod";

/**
 * Takes an endpoint path and extracts any path parameters as a Tuple.
 * It recognises Express-style path parameters: `/users/:user_id`.
 */
export type ExtractRouteParamsAsList<Route> =
  Route extends string
    ? Route extends `${infer Before}/:${infer Token}/${infer Rest}` // TODO - Why did I put "Before" here?
      ? [Token, ...ExtractRouteParamsAsList<Rest>]
      : Route extends `${infer Before}/:${infer Token}`
        ? [Token]
        : []
    : never

/**
 * Helper type used to parse a path parameter string extracted from a URL, and turn it into an object
 * with the param name and primitive type for the parameter. Types can be provided in the
 * `:token<string>` format; if a type is not provided, it defaults to `string`.
 */
export type RouteParamToPrimitiveTypeKeyValue<Param> =
  Param extends string
    ? Param extends ""
      ? never
      : Param extends `${infer Name}<${infer TypeStr}>`
        ? { key: Name, value: ParsePrimitiveTypeString<TypeStr> }
        : { key: Param, value: string }
    : never

/**
 * Helper type used to turn a path parameter extracted from a URL into a `{ name: ZodType<type> }` object
 */
export type RouteParamToZodTypeObject<Param extends string> = RouteParamToPrimitiveTypeKeyValue<Param> extends {
  key: infer K extends string,
  value: infer V
} ? {
  [Key in K]: ZodType<V>
} : never

/**
 * Helper type used to turn a list of path parameters extracted from a URL into a list of `{ name: ZodType<type> }`
 * objects for further processing
 */
export type RouteParamListToZodTypeObjectList<T extends string[]> = {
  [K in keyof T]: RouteParamToZodTypeObject<T[K]>
}

/**
 * Used to generate the ZodSchema for path parameters in a given URL path
 */
export type RouteParamOutputSchema<Route extends string> =
  MergeArrayOfObjects<
    RouteParamListToZodTypeObjectList<
      ExtractRouteParamsAsList<Route>
    >
  >

/**
 * Used to calculate Zod schema to validate path parameters for a given URL path.
 * Returns an empty object schema if the path contains no parameters.
 */
export type PathParamZodSchema<Route extends string> =
  ExtractRouteParamsAsList<Route> extends []
    ? ZodObject<{}>
    : ZodObject<RouteParamOutputSchema<Route>>

/**
 * Used to calculate the output shape for validated path parameters for a given URL path.
 * Returns empty object if the path contains no parameters.
 */
export type RouteParamOutputType<Route extends string> = z.infer<PathParamZodSchema<Route>>

/**
 * Used to join two Path segments, gracefully handling preceding/trailing slashes
 */
export type RouteConcat<A extends string, B extends string> =
  `${StripStringSuffix<A, "/">}/${StripStringPrefix<B, "/">}`