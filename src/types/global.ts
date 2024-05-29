import { ZodOptional, ZodTypeAny } from "zod";

/**
 * Takes a primitive type name as a string, and returns the primitive type
 */
export type ParsePrimitiveTypeString<T extends string> =
  T extends "string"
    ? string
    : T extends "number"
      ? number
      : T extends "boolean"
        ? boolean
        : never

/**
 * Takes a list of objects and turns them into a single intersection type
 */
export type MergeArrayOfObjects<List> =
  List extends [infer O, ...infer Rest]
    ? O & MergeArrayOfObjects<Rest>
    : {}

/**
 * Takes an object and generates a type where all attributes are optional, but *at least one*
 * of them must always be set.
 */
export type RequireAtLeastOneKey<T extends {}> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

/**
 * Joins two string literals into one and returns the resulting type
 */
export type StringConcat<A extends string, B extends string> = `${A}${B}`

/**
 * Takes a list of string literals, and returns a single string literal which is a combination of the elements
 */
export type StringListConcat<List extends string[]> =
  List extends [infer T extends string, ...infer Rest extends string[]]
    ? StringConcat<T, StringListConcat<Rest>>
    : ""

export type StripStringPrefix<In extends string, Prefix extends string> =
  In extends `${Prefix}${infer Out}`
    ? Out
    : In

export type StripStringSuffix<In extends string, Suffix extends string> =
  In extends `${infer Out}${Suffix}`
    ? Out
    : In

/**
 * Takes a ZodType and wraps it in ZodOptional
 */
export type OptionalZodType<T extends ZodTypeAny> = ZodOptional<T>