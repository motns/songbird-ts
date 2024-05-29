import {
  z,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodEnum,
  ZodNumber,
  ZodObject,
  ZodString
} from "zod";
import { OptionalZodType } from "./global";
import { RestEndpoint } from "../libs/webservice/rest/RestEndpoint";
import { RestEndpointDef } from "../libs/webservice/rest/RestEndpointDef";
import { Authenticator } from "../libs/webservice/authentication/Authenticator";
import { SongbirdSanitizedRequest } from "../libs/webservice/request/SongbirdSanitizedRequest";
import { GetAuthenticatorOutput } from "./authentication";

export type AllowedZodTypes = ZodString | ZodNumber | ZodBigInt | ZodBoolean | ZodDate | ZodEnum<[string, ...string[]]>
type ZodOpt = OptionalZodType<AllowedZodTypes>
export type EndpointParamSchemaType = ZodObject<{ [k: string]: AllowedZodTypes | ZodOpt }> | ZodObject<{}>
export type EndpointParamType = z.infer<EndpointParamSchemaType>

export type EndpointSchemas<
  PathParamsSchema extends EndpointParamSchemaType,
  QueryParamsSchema extends EndpointParamSchemaType,
  RequestHeadersSchema extends EndpointParamSchemaType,
  RequestCookiesSchema extends EndpointParamSchemaType,
  ResponseHeadersSchema extends EndpointParamSchemaType,
  ResponseCookiesSchema extends EndpointParamSchemaType,
> = {
  pathParams: PathParamsSchema,
  queryParams: QueryParamsSchema,
  requestHeaders: RequestHeadersSchema,
  requestCookies: RequestCookiesSchema,
  responseHeaders: ResponseHeadersSchema,
  responseCookies: ResponseCookiesSchema,
}

export type AnyRestEndpointDef = RestEndpointDef<any, any, any, any, any, any, any, any, any, any, any, any>

export type AnyRestEndpoint = RestEndpoint<any, any, any, any, any, any, any, any, any, any, any, any, any>

export type GetSanitizedRequestType<
  ED extends AnyRestEndpointDef,
  A extends Authenticator<any>
> =
  ED extends RestEndpointDef<
      any,
      infer PathParamsSchema,
      infer QueryParamsSchema,
      infer RequestHeadersSchema,
      infer RequestCookiesSchema,
      any,
      any,
      any,
      infer RequestParserOut,
      any,
      any,
      any
    >
    ? SongbirdSanitizedRequest<
      z.infer<PathParamsSchema>,
      z.infer<QueryParamsSchema>,
      z.infer<RequestHeadersSchema>,
      z.infer<RequestCookiesSchema>,
      GetAuthenticatorOutput<A>,
      RequestParserOut
    >
    : never

export type RestHandlerReturnType<ED extends AnyRestEndpointDef> =
  ED extends RestEndpointDef<
      any,
      any,
      any,
      any,
      any,
      infer ResponseHeadersSchema,
      any,
      any,
      any,
      infer SuccessResponseWriterIn,
      any,
      any
    >
    ? Promise<{
      body: SuccessResponseWriterIn,
      headers: z.infer<ResponseHeadersSchema>,
    }>
    : never

export type RestHandler<
  ED extends AnyRestEndpointDef,
  A extends Authenticator<any>
> = (req: GetSanitizedRequestType<ED, A>) => RestHandlerReturnType<ED>
