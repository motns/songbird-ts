import type {
  ExtractRouteParamsAsList,
  RouteConcat,
  RouteParamListToTypeObjectList,
  RouteParamOutput,
  RouteParamOutputType,
  RouteParamToPrimitiveTypeObject,
  RouteParamToTypeObject,
} from "../../src/types/urlUtils.js";
import type { Equal, ExpectFalse, ExpectTrue } from "./helpers.js";

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// ExtractRouteParamsAsList

// not a string
{
  type Expected = never;
  type Actual = ExtractRouteParamsAsList<12>;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// no params
{
  type Expected = [];
  type Actual = ExtractRouteParamsAsList<"/users">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// single param
{
  type Expected = ["user_id"];
  type Actual = ExtractRouteParamsAsList<"/users/:user_id">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// single param with type
{
  type Expected = ["user_id<number>"];
  type Actual = ExtractRouteParamsAsList<"/users/:user_id<number>">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// multiple params
{
  type Expected = ["user_id", "post_id"];
  type Actual = ExtractRouteParamsAsList<"/users/:user_id/posts/:post_id">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// invalid result
{
  type Expected = ["post_id", "user_id"];
  type Actual = ExtractRouteParamsAsList<"/users/:user_id/posts/:post_id">;
  type _Res = ExpectFalse<Equal<Actual, Expected>>;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// RouteParamToPrimitiveTypeObject

// not a string
{
  type Expected = never;
  type Actual = RouteParamToPrimitiveTypeObject<12>;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// empty string
{
  type Expected = never;
  type Actual = RouteParamToPrimitiveTypeObject<"">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// untyped param, defaults to string
{
  type Expected = { key: "user_id"; value: string };
  type Actual = RouteParamToPrimitiveTypeObject<"user_id">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// typed param
{
  type Expected = { key: "user_id"; value: number };
  type Actual = RouteParamToPrimitiveTypeObject<"user_id<number>">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// RouteParamToTypeObject

// empty string
{
  type Expected = never;
  type Actual = RouteParamToTypeObject<"">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// untyped param, defaults to string
{
  type Expected = { user_id: string };
  type Actual = RouteParamToTypeObject<"user_id">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// typed param
{
  type Expected = { post_id: number };
  type Actual = RouteParamToTypeObject<"post_id<number>">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// RouteParamListToTypeObjectList

// empty list
{
  type Expected = [];
  type Actual = RouteParamListToTypeObjectList<[]>;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// mixed list
{
  type Expected = [{ user_id: string }, { post_id: number }];
  type Actual = RouteParamListToTypeObjectList<["user_id", "post_id<number>"]>;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// RouteParamOutput

// no params
{
  type Expected = {};
  type Actual = RouteParamOutput<"/users">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// single param
{
  type Expected = { user_id: string };
  type Actual = RouteParamOutput<"/users/:user_id">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// multiple params
{
  type Expected = { user_id: string } & { post_id: number };
  type Actual = RouteParamOutput<"/users/:user_id/posts/:post_id<number>">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// RouteParamOutputType

// no params
{
  type Expected = Record<string, never>;
  type Actual = RouteParamOutputType<"/users">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// with params
{
  type Expected = { user_id: string } & { post_id: number };
  type Actual = RouteParamOutputType<"/users/:user_id/posts/:post_id<number>">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// invalid result
{
  type Expected = { user_id: number };
  type Actual = RouteParamOutputType<"/users/:user_id">;
  type _Res = ExpectFalse<Equal<Actual, Expected>>;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// RouteConcat

// both without slashes
{
  type Expected = "users/posts";
  type Actual = RouteConcat<"users", "posts">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// A with trailing slash, B with leading slash
{
  type Expected = "users/posts";
  type Actual = RouteConcat<"users/", "/posts">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}

// empty segments
{
  type Expected = "/";
  type Actual = RouteConcat<"", "">;
  type _Res = ExpectTrue<Equal<Actual, Expected>>;
}
