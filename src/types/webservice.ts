import * as z from "zod";
import { RestEndpoint } from "../libs/webservice/rest/RestEndpoint.js";
import { RestEndpointConfig } from "../libs/webservice/rest/RestEndpointConfig.js";
import type { Cookie } from "../libs/webservice/response/Cookie.js";

// Based on the query parser `qs` library's output type
// The QueryParamsSchema below is not based on it, because we generally don't get a concrete type
// in the framework Adaptor class to pass on.
export type RawQueryParams = {
  [key: string]: undefined | string | RawQueryParams | (string | RawQueryParams)[];
};

export type RawRequestHeaders = Record<string, string | string[] | undefined>;

export type PathParamType = Record<string, any> | Record<string, never>;

export type EndpointParamType = Record<string, any | undefined> | Record<string, never>;

export type ResponseHeadersType = Record<string, string | string[]> | Record<string, never>;

export type CookieDefinitions = Record<string, string> | Record<string, never>;
export type ResponseCookiesType<Cookies extends CookieDefinitions> = {
  [K in keyof Cookies]: K extends string ? Cookie<K> : never;
};

export type PathParamZodType<Output extends PathParamType = PathParamType> = z.ZodObject &
  z.ZodType<Output, Record<string, string>>;

export type EndpointParamZodType<Output extends EndpointParamType = EndpointParamType> =
  z.ZodObject & z.ZodType<Output, Record<string, string>>;

export type ResponseHeaderZodType<Output extends ResponseHeadersType = ResponseHeadersType> =
  z.ZodObject & z.ZodType<Output, unknown>;

export type EndpointSchemas<
  PathParamsSchema extends PathParamZodType,
  QueryParamsSchema extends EndpointParamZodType,
  RequestHeadersSchema extends EndpointParamZodType,
  RequestCookiesSchema extends EndpointParamZodType,
  SuccessResponseHeadersSchema extends ResponseHeaderZodType,
  ErrorResponseHeadersSchema extends ResponseHeaderZodType,
> = {
  pathParams: PathParamsSchema;
  queryParams: QueryParamsSchema;
  requestHeaders: RequestHeadersSchema;
  requestCookies: RequestCookiesSchema;
  successResponseHeaders: SuccessResponseHeadersSchema;
  errorResponseHeaders: ErrorResponseHeadersSchema;
};

export type AnyRestEndpointConfig = RestEndpointConfig<
  string,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

export type AnyRestEndpoint = RestEndpoint<
  string,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;
