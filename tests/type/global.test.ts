import type {
  MergeArrayOfObjects,
  ParsePrimitiveTypeString,
  StripStringPrefix,
  StripStringSuffix
} from "../../src/types/global.js";
import type { Equal, ExpectFalse, ExpectTrue } from "./helpers.js";

{
  const _validString: ParsePrimitiveTypeString<"string"> = "hello"
  // @ts-expect-error Not a valid string
  const _notString: ParsePrimitiveTypeString<"string"> = 2

  const _validNumber: ParsePrimitiveTypeString<"number"> = 2
  // @ts-expect-error Not a valid number
  const _notNumber: ParsePrimitiveTypeString<"number"> = "foo"

  const _validBoolean: ParsePrimitiveTypeString<"boolean"> = true
  // @ts-expect-error Not a valid boolean
  const _notBoolean: ParsePrimitiveTypeString<"boolean"> = 3

  const _validBigint: ParsePrimitiveTypeString<"bigint"> = BigInt("9007199254740991")
  // @ts-expect-error Not a valid bigint
  const _notBigint: ParsePrimitiveTypeString<"bigint"> = 123

  // @ts-expect-error Not assignable to never
  const _notValidType: ParsePrimitiveTypeString<"varchar"> = "hello"
}


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// MergeArrayOfObjects

{
  // @ts-expect-error Not object
  type _NotObject = MergeArrayOfObjects<["a", "b", "c"]>
}

// valid objects
{
  type MergeExpected = { a: number } & { b: string } & { c: boolean }
  type MergeActual = MergeArrayOfObjects<[{ a: number }, { b: string }, { c: boolean }]>
  type _Res = ExpectTrue<Equal<MergeActual, MergeExpected>>
}

// valid empty object list
{
  type MergeExpected = {}
  type MergeActual = MergeArrayOfObjects<[]>
  type _Res = ExpectTrue<Equal<MergeActual, MergeExpected>>
}

// invalid result
{
  type MergeExpected = { a: number, b: string, c: boolean }
  type MergeActual = MergeArrayOfObjects<[{ a: number }, { b: string }, { c: boolean }]>
  type _Res = ExpectFalse<Equal<MergeActual, MergeExpected>>
}


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// StripStringPrefix

{
  // @ts-expect-error Not string
  type _NotString1 = StripStringPrefix<12, "foo">
  // @ts-expect-error Not string
  type _NotString2 = StripStringPrefix<"bar", 34>
}

// empty string
{
  type Expected = ""
  type Actual = StripStringPrefix<"", "">
  type _Res = ExpectTrue<Equal<Actual, Expected>>
}

// valid string
{
  type Expected = "users"
  type Actual = StripStringPrefix<"/users", "/">
  type _Res = ExpectTrue<Equal<Actual, Expected>>
}


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// StripStringSuffix

{
  // @ts-expect-error Not string
  type _NotString1 = StripStringSuffix<12, "foo">
  // @ts-expect-error Not string
  type _NotString2 = StripStringSuffix<"bar", 34>
}

// empty string
{
  type Expected = ""
  type Actual = StripStringSuffix<"", "">
  type _Res = ExpectTrue<Equal<Actual, Expected>>
}

// valid string
{
  type Expected = "posts"
  type Actual = StripStringSuffix<"posts/", "/">
  type _Res = ExpectTrue<Equal<Actual, Expected>>
}