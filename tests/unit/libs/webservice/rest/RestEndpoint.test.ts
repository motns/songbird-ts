import { z } from "zod";
import { describe, it, expect, vi } from "vitest";
import { RestEndpoint } from "../../../../../src/libs/webservice/rest/RestEndpoint.js";
import { RestEndpointConfig } from "../../../../../src/libs/webservice/rest/RestEndpointConfig.js";
import { Authenticator } from "../../../../../src/libs/webservice/authentication/Authenticator.js";
import { PreAuthorizer } from "../../../../../src/libs/webservice/authorization/PreAuthorizer.js";
import { Authorizer } from "../../../../../src/libs/webservice/authorization/Authorizer.js";
import { RawRequest } from "../../../../../src/libs/webservice/request/RawRequest.js";
import type { SanitizedRequest } from "../../../../../src/libs/webservice/request/SanitizedRequest.js";
import { OkResponse } from "../../../../../src/libs/webservice/response/OkResponse.js";
import { BadRequestResponse } from "../../../../../src/libs/webservice/response/BadRequestResponse.js";
import { UnauthenticatedResponse } from "../../../../../src/libs/webservice/response/UnauthenticatedResponse.js";
import { UnauthorisedResponse } from "../../../../../src/libs/webservice/response/UnauthorisedResponse.js";
import { InternalErrorResponse } from "../../../../../src/libs/webservice/response/InternalErrorResponse.js";
import { httpStatus, type HttpStatus } from "../../../../../src/enums/http.js";
import type { AuthenticationResult } from "../../../../../src/types/authentication.js";
import type { RequestValidatorFunction } from "../../../../../src/types/validation.js";
import type { SecuritySchemeObject } from "openapi3-ts/oas31";
import type { ResponseConfig } from "@asteasolutions/zod-to-openapi";

type AuthOutput = { userId: number } | null;

class StubAuthenticator extends Authenticator<AuthOutput> {
  result: AuthenticationResult<AuthOutput> = { isValid: true, isAuthenticated: true, output: null };

  constructor() {
    super("stub-auth", "Stub authenticator");
  }

  async authenticate(): Promise<AuthenticationResult<AuthOutput>> {
    return this.result;
  }

  protected generateOpenApiDefinition(): SecuritySchemeObject | undefined {
    return { type: "http", scheme: "bearer" };
  }
}

class OpenStubAuthenticator extends Authenticator<AuthOutput> {
  result: AuthenticationResult<AuthOutput> = { isValid: true, isAuthenticated: true, output: null };

  constructor() {
    super("open-stub-auth", "Open stub authenticator");
  }

  async authenticate(): Promise<AuthenticationResult<AuthOutput>> {
    return this.result;
  }

  protected generateOpenApiDefinition(): SecuritySchemeObject | undefined {
    return undefined;
  }
}

function createEndpoint(
  overrides: {
    authenticator?: Authenticator<AuthOutput>;
    preAuthorizer?: PreAuthorizer<AuthOutput>;
    authorizer?: Authorizer<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      AuthOutput,
      null
    >;
    endpointConfig?: ReturnType<typeof RestEndpointConfig.create>;
    requestHandler?: (
      req: SanitizedRequest<
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        AuthOutput,
        null
      >,
    ) => Promise<OkResponse<Record<string, never>, Record<string, never>, unknown>>;
    additionalRequestValidators?: RequestValidatorFunction<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      null
    >[];
    successHttpStatus?: HttpStatus;
    tags?: string[];
  } = {},
) {
  return new RestEndpoint({
    operationId: "getUsers",
    docs: {
      endpointSummary: "Get users",
      endpointDescription: "Returns a list of users",
      ...(overrides.tags !== undefined && { tags: overrides.tags }),
    },
    method: "get",
    endpointConfig: overrides.endpointConfig ?? RestEndpointConfig.create(),
    authenticator: overrides.authenticator ?? new StubAuthenticator(),
    requestHandler: overrides.requestHandler ?? (async () => new OkResponse(null, {}, {})),
    ...(overrides.preAuthorizer !== undefined && { preAuthorizer: overrides.preAuthorizer }),
    ...(overrides.authorizer !== undefined && { authorizer: overrides.authorizer }),
    ...(overrides.additionalRequestValidators !== undefined && {
      additionalRequestValidators: overrides.additionalRequestValidators,
    }),
    ...(overrides.successHttpStatus !== undefined && {
      successHttpStatus: overrides.successHttpStatus,
    }),
  });
}

function rawRequest(
  overrides: Partial<{
    queryParams: Record<string, string>;
    headers: Record<string, string>;
    cookies: Record<string, string>;
  }> = {},
): RawRequest {
  return new RawRequest(
    "get",
    "/users",
    "trace-1",
    {},
    overrides.queryParams ?? {},
    overrides.headers ?? {},
    overrides.cookies ?? {},
    undefined,
    undefined,
  );
}

describe("RestEndpoint", () => {
  describe("constructor defaults", () => {
    it("defaults tags to an empty array and successHttpStatus to 200 OK", () => {
      const endpoint = createEndpoint();

      expect(endpoint.tags).toEqual([]);
      expect(endpoint.successHttpStatus).toEqual(httpStatus.OK);
    });

    it("uses the provided tags and successHttpStatus", () => {
      const endpoint = createEndpoint({ tags: ["users"], successHttpStatus: httpStatus.CREATED });

      expect(endpoint.tags).toEqual(["users"]);
      expect(endpoint.successHttpStatus).toEqual(httpStatus.CREATED);
    });
  });

  describe("processRequest", () => {
    it("returns a bad request response when authentication fails validation", async () => {
      const authenticator = new StubAuthenticator();
      authenticator.result = {
        isValid: false,
        isAuthenticated: false,
        validationErrors: {
          header: {
            errors: [
              {
                code: "invalid_type",
                message: "Invalid input: expected string, received undefined",
              },
            ],
          },
        },
      };
      const endpoint = createEndpoint({ authenticator });

      const result = await endpoint.processRequest(rawRequest());

      expect(result.response).toBeInstanceOf(BadRequestResponse);
      expect(result.response.body).toEqual({
        header: {
          errors: [
            { code: "invalid_type", message: "Invalid input: expected string, received undefined" },
          ],
        },
      });
      expect(result.writer).toBe(endpoint.config.validationErrorWriter);
    });

    it("returns an unauthenticated response when the client is not authenticated", async () => {
      const authenticator = new StubAuthenticator();
      authenticator.result = {
        isValid: true,
        isAuthenticated: false,
        message: "Invalid credentials",
      };
      const endpoint = createEndpoint({ authenticator });

      const result = await endpoint.processRequest(rawRequest());

      expect(result.response).toBeInstanceOf(UnauthenticatedResponse);
      expect(result.writer).toBe(endpoint.config.errorMessageWriter);
    });

    it("returns an unauthorised response when the pre-authorizer rejects the request", async () => {
      const preAuthorizer = new PreAuthorizer<AuthOutput>(() => false);
      const endpoint = createEndpoint({ preAuthorizer });

      const result = await endpoint.processRequest(rawRequest());

      expect(result.response).toBeInstanceOf(UnauthorisedResponse);
      expect(result.writer).toBe(endpoint.config.errorMessageWriter);
    });

    it("returns a bad request response when request sanitization fails", async () => {
      const config = RestEndpointConfig.create().queryParams(z.object({ limit: z.string() }));
      const endpoint = new RestEndpoint({
        operationId: "getUsers",
        docs: { endpointSummary: "Get users", endpointDescription: "Returns a list of users" },
        method: "get",
        endpointConfig: config,
        authenticator: new StubAuthenticator(),
        requestHandler: async () => new OkResponse(null, {}, {}),
      });

      const result = await endpoint.processRequest(rawRequest());

      expect(result.response).toBeInstanceOf(BadRequestResponse);
      if (result.response instanceof BadRequestResponse) {
        expect(result.response.body.queryParam).toEqual({
          properties: {
            limit: {
              errors: [
                {
                  code: "invalid_type",
                  message: "Invalid input: expected string, received undefined",
                  params: { expected: "string" },
                },
              ],
            },
          },
        });
      }
      expect(result.writer).toBe(endpoint.config.validationErrorWriter);
    });

    it("returns an unauthorised response when the post-validation authorizer rejects the request", async () => {
      const authorizer = new Authorizer<
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        AuthOutput,
        null
      >(async () => false);
      const endpoint = createEndpoint({ authorizer });

      const result = await endpoint.processRequest(rawRequest());

      expect(result.response).toBeInstanceOf(UnauthorisedResponse);
      expect(result.writer).toBe(endpoint.config.errorMessageWriter);
    });

    it("calls the request handler and returns its response on success", async () => {
      const requestHandler = vi.fn(async () => new OkResponse({ ok: true }, {}, {}));
      const endpoint = createEndpoint({ requestHandler });

      const result = await endpoint.processRequest(rawRequest());

      expect(requestHandler).toHaveBeenCalledOnce();
      expect(result.response).toBeInstanceOf(OkResponse);
      expect(result.response.body).toEqual({ ok: true });
      expect(result.writer).toBe(endpoint.config.successResponseWriter);
    });

    it("returns an internal error response when the request handler throws", async () => {
      const requestHandler = vi.fn(
        async (): Promise<OkResponse<Record<string, never>, Record<string, never>, unknown>> => {
          throw new Error("boom");
        },
      );
      const endpoint = createEndpoint({ requestHandler });

      const result = await endpoint.processRequest(rawRequest());

      expect(result.response).toBeInstanceOf(InternalErrorResponse);
      expect(result.response.body).toEqual({ error: "Failed to process request" });
      expect(result.writer).toBe(endpoint.config.errorMessageWriter);
    });

    it("returns a bad request response with merged global errors when additional validators fail", async () => {
      const validatorA: RequestValidatorFunction<
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        null
      > = async () => ({
        isValid: false,
        validationErrors: { errors: [{ code: "custom", message: "Validator A failed" }] },
      });
      const validatorB: RequestValidatorFunction<
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        null
      > = async () => ({
        isValid: false,
        validationErrors: { errors: [{ code: "custom", message: "Validator B failed" }] },
      });

      const endpoint = createEndpoint({ additionalRequestValidators: [validatorA, validatorB] });

      const result = await endpoint.processRequest(rawRequest());

      expect(result.response).toBeInstanceOf(BadRequestResponse);
      if (result.response instanceof BadRequestResponse) {
        expect(result.response.body.global).toEqual({
          errors: [
            { code: "custom", message: "Validator A failed" },
            { code: "custom", message: "Validator B failed" },
          ],
        });
      }
    });

    it("proceeds to the request handler when all additional validators pass", async () => {
      const validator: RequestValidatorFunction<
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        null
      > = async () => ({ isValid: true });
      const requestHandler = vi.fn(async () => new OkResponse(null, {}, {}));

      const endpoint = createEndpoint({ additionalRequestValidators: [validator], requestHandler });

      const result = await endpoint.processRequest(rawRequest());

      expect(requestHandler).toHaveBeenCalledOnce();
      expect(result.response).toBeInstanceOf(OkResponse);
    });
  });

  describe("openApiDefinition", () => {
    it("reflects the endpoint's method, operationId, docs, tags and path", () => {
      const endpoint = createEndpoint({ tags: ["users"] });

      expect(endpoint.openApiDefinition.method).toEqual("get");
      expect(endpoint.openApiDefinition.operationId).toEqual("getUsers");
      expect(endpoint.openApiDefinition.summary).toEqual("Get users");
      expect(endpoint.openApiDefinition.description).toEqual("Returns a list of users");
      expect(endpoint.openApiDefinition.tags).toEqual(["users"]);
      expect(endpoint.openApiDefinition.path).toEqual(endpoint.config.openApiPath);
    });

    it("omits security when the authenticator has no OpenAPI definition", () => {
      const endpoint = createEndpoint({ authenticator: new OpenStubAuthenticator() });

      expect(endpoint.openApiDefinition.security).toEqual([]);
    });

    it("sets security with deduplicated pre-authorizer and authorizer scopes when the authenticator is documented", () => {
      const preAuthorizer = new PreAuthorizer<AuthOutput>(
        () => true,
        ["read:users", "shared:scope"],
      );
      const authorizer = new Authorizer<
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        AuthOutput,
        null
      >(async () => true, ["write:users", "shared:scope"]);
      const endpoint = createEndpoint({ preAuthorizer, authorizer });

      expect(endpoint.openApiDefinition.security).toEqual([
        { "stub-auth": ["read:users", "shared:scope", "write:users"] },
      ]);
    });

    it("omits empty path/query/cookie/header schemas from the request definition", () => {
      const endpoint = createEndpoint();

      expect(endpoint.openApiDefinition.request?.params).toBeUndefined();
      expect(endpoint.openApiDefinition.request?.query).toBeUndefined();
      expect(endpoint.openApiDefinition.request?.cookies).toBeUndefined();
      expect(endpoint.openApiDefinition.request?.headers).toBeUndefined();
    });

    it("includes non-empty path/query/cookie/header schemas in the request definition", () => {
      const config = RestEndpointConfig.create()
        .route("/users/:id", z.object({ id: z.string() }))
        .queryParams(z.object({ search: z.string() }))
        .requestCookies(z.object({ session: z.string() }))
        .requestHeaders(z.object({ "x-request-id": z.string() }));
      const endpoint = new RestEndpoint({
        operationId: "getUser",
        docs: { endpointSummary: "Get user", endpointDescription: "Returns a single user" },
        method: "get",
        endpointConfig: config,
        authenticator: new StubAuthenticator(),
        requestHandler: async () => new OkResponse(null, {}, {}),
      });

      expect(endpoint.openApiDefinition.request?.params).toBe(config.schemas.pathParams);
      expect(endpoint.openApiDefinition.request?.query).toBe(config.schemas.queryParams);
      expect(endpoint.openApiDefinition.request?.cookies).toBe(config.schemas.requestCookies);
      expect(endpoint.openApiDefinition.request?.headers).toBe(config.schemas.requestHeaders);
    });

    it("omits the request body when the request body reader has no OpenAPI definition", () => {
      const endpoint = createEndpoint();

      expect(endpoint.openApiDefinition.request?.body).toBeUndefined();
    });

    it("includes the request body when the request body reader has an OpenAPI definition", () => {
      const config = RestEndpointConfig.create().jsonRequestBody(z.object({ name: z.string() }));
      const endpoint = new RestEndpoint({
        operationId: "createUser",
        docs: { endpointSummary: "Create user", endpointDescription: "Creates a new user" },
        method: "post",
        endpointConfig: config,
        authenticator: new StubAuthenticator(),
        requestHandler: async () => new OkResponse(null, {}, {}),
      });

      expect(endpoint.openApiDefinition.request?.body).toBe(
        config.requestBodyReader.openApiDefinition,
      );
    });

    it("always includes BAD_REQUEST and INTERNAL_SERVER_ERROR responses", () => {
      const endpoint = createEndpoint();

      expect(endpoint.openApiDefinition.responses[httpStatus.BAD_REQUEST]).toBeDefined();
      expect(endpoint.openApiDefinition.responses[httpStatus.INTERNAL_SERVER_ERROR]).toBeDefined();
    });

    it("omits success response headers when the schema is empty, and includes content only when the writer documents one", () => {
      const endpoint = createEndpoint();
      const successResponse = endpoint.openApiDefinition.responses[httpStatus.OK] as
        | ResponseConfig
        | undefined;

      expect(successResponse).toBeDefined();
      expect(successResponse?.headers).toBeUndefined();
      expect(successResponse?.content).toBeUndefined();
    });

    it("includes success response headers and content when the schema/writer document them", () => {
      const config = RestEndpointConfig.create()
        .responseHeaders(z.object({ "x-rate-limit": z.string() }))
        .textResponseBody("A greeting");
      const endpoint = new RestEndpoint({
        operationId: "getGreeting",
        docs: { endpointSummary: "Get greeting", endpointDescription: "Returns a greeting" },
        method: "get",
        endpointConfig: config,
        authenticator: new StubAuthenticator(),
        requestHandler: async () => new OkResponse("hello", { "x-rate-limit": "10" }, {}),
      });
      const successResponse = endpoint.openApiDefinition.responses[httpStatus.OK] as
        | ResponseConfig
        | undefined;

      expect(successResponse?.headers).toBe(config.schemas.successResponseHeaders);
      expect(successResponse?.content).toBe(config.successResponseWriter.openApiDefinition);
    });

    it("omits UNAUTHORIZED when the authenticator has no OpenAPI definition", () => {
      const endpoint = createEndpoint({ authenticator: new OpenStubAuthenticator() });

      expect(endpoint.openApiDefinition.responses[httpStatus.UNAUTHORIZED]).toBeUndefined();
    });

    it("includes UNAUTHORIZED when the authenticator has an OpenAPI definition", () => {
      const endpoint = createEndpoint();

      expect(endpoint.openApiDefinition.responses[httpStatus.UNAUTHORIZED]).toBeDefined();
    });

    it("omits FORBIDDEN when there is no pre-authorizer or authorizer", () => {
      const endpoint = createEndpoint();

      expect(endpoint.openApiDefinition.responses[httpStatus.FORBIDDEN]).toBeUndefined();
    });

    it("includes FORBIDDEN when a pre-authorizer is set", () => {
      const preAuthorizer = new PreAuthorizer<AuthOutput>(() => true);
      const endpoint = createEndpoint({ preAuthorizer });

      expect(endpoint.openApiDefinition.responses[httpStatus.FORBIDDEN]).toBeDefined();
    });

    it("includes FORBIDDEN when an authorizer is set", () => {
      const authorizer = new Authorizer<
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        AuthOutput,
        null
      >(async () => true);
      const endpoint = createEndpoint({ authorizer });

      expect(endpoint.openApiDefinition.responses[httpStatus.FORBIDDEN]).toBeDefined();
    });
  });
});
