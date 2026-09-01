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
        : T extends "bigint"
          ? bigint
          : never

/**
 * Takes a list of objects and turns them into a single intersection type
 */
export type MergeArrayOfObjects<List extends object[]> =
  List extends [infer O, ...infer Rest extends object[]]
    ? O & MergeArrayOfObjects<Rest>
    : {}

export type StripStringPrefix<In extends string, Prefix extends string> =
  In extends `${Prefix}${infer Out}`
    ? Out
    : In

export type StripStringSuffix<In extends string, Suffix extends string> =
  In extends `${infer Out}${Suffix}`
    ? Out
    : In