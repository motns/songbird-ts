import { z } from "zod";
import { describe, it, expect } from "vitest";
import { RestEndpointConfig } from "../../../../../src/libs/webservice/rest/RestEndpointConfig.js";
import { DefaultErrorHandler, type ErrorHandler } from "../../../../../src/libs/webservice/rest/ErrorHandler.js";
import { emptyBodyReader } from "../../../../../src/libs/webservice/request/reader/EmptyBodyReader.js";
import { emptyResponseWriter } from "../../../../../src/libs/webservice/response/writer/EmptyResponseWriter.js";
import { textErrorMessageWriter } from "../../../../../src/libs/webservice/response/writer/error/TextErrorMessageWriter.js";
import { textValidationErrorWriter } from "../../../../../src/libs/webservice/response/writer/error/TextValidationErrorWriter.js";
import { jsonErrorMessageWriter } from "../../../../../src/libs/webservice/response/writer/error/JsonErrorMessageWriter.js";
import { jsonValidationErrorWriter } from "../../../../../src/libs/webservice/response/writer/error/JsonValidationErrorWriter.js";
import { xmlErrorMessageWriter } from "../../../../../src/libs/webservice/response/writer/error/XMLErrorMessageWriter.js";
import { xmlValidationErrorWriter } from "../../../../../src/libs/webservice/response/writer/error/XMLValidationErrorWriter.js";
import { JsonBodyReader } from "../../../../../src/libs/webservice/request/reader/JsonBodyReader.js";
import { RequestBodyReader } from "../../../../../src/libs/webservice/request/reader/RequestBodyReader.js";
import { JsonResponseWriter } from "../../../../../src/libs/webservice/response/writer/JsonResponseWriter.js";
import { XMLResponseWriter } from "../../../../../src/libs/webservice/response/writer/XMLResponseWriter.js";
import { TextResponseWriter } from "../../../../../src/libs/webservice/response/writer/TextResponseWriter.js";
import { mimeTypes } from "../../../../../src/enums/mime.js";
import { BadRequestResponse } from "../../../../../src/libs/webservice/response/BadRequestResponse.js";
import { InternalErrorResponse } from "../../../../../src/libs/webservice/response/InternalErrorResponse.js";
import { UnauthenticatedResponse } from "../../../../../src/libs/webservice/response/UnauthenticatedResponse.js";
import { UnauthorisedResponse } from "../../../../../src/libs/webservice/response/UnauthorisedResponse.js";
import type { DataSanitizationResult } from "../../../../../src/types/sanitization.js";

describe("RestEndpointConfig", () => {
  describe("create", () => {
    it("returns a default config with empty schemas and plain-text defaults", () => {
      const config = RestEndpointConfig.create()

      expect(config.routePattern).toEqual("/")
      expect(config.openApiPath).toEqual("/")
      expect(config.requestBodyReader).toBe(emptyBodyReader)
      expect(config.successResponseWriter).toBe(emptyResponseWriter)
      expect(config.successResponseCookies).toEqual({})
      expect(config.errorMessageWriter).toBe(textErrorMessageWriter)
      expect(config.errorResponseCookies).toEqual({})
      expect(config.validationErrorWriter).toBe(textValidationErrorWriter)
      expect(config.errorHandler).toBeInstanceOf(DefaultErrorHandler)

      for (const key of [
        "pathParams", "queryParams", "requestHeaders", "requestCookies",
        "successResponseHeaders", "errorResponseHeaders"
      ] as const) {
        expect(config.schemas[key]).toBeInstanceOf(z.ZodObject)
        expect(config.schemas[key].shape).toEqual({})
      }
    })
  })

  describe("route", () => {
    it("updates the route pattern, OpenAPI path and path params schema, without mutating the original", () => {
      const base = RestEndpointConfig.create()
      const pathParamsSchema = z.object({ id: z.string() })
      const updated = base.route("/users/:id", pathParamsSchema)

      expect(updated.routePattern).toEqual("/users/:id")
      expect(updated.openApiPath).toEqual("/users/{id}")
      expect(updated.schemas.pathParams).toBe(pathParamsSchema)

      expect(base.routePattern).toEqual("/")
      expect(base.openApiPath).toEqual("/")
    })
  })

  describe("queryParams", () => {
    it("replaces the query params schema, without mutating the original", () => {
      const base = RestEndpointConfig.create()
      const schema = z.object({ search: z.string() })
      const updated = base.queryParams(schema)

      expect(updated.schemas.queryParams).toBe(schema)
      expect(base.schemas.queryParams.shape).toEqual({})
    })
  })

  describe("noQueryParams", () => {
    it("resets the query params schema to an empty object", () => {
      const updated = RestEndpointConfig.create()
        .queryParams(z.object({ search: z.string() }))
        .noQueryParams()

      expect(updated.schemas.queryParams.shape).toEqual({})
    })
  })

  describe("requestHeaders", () => {
    it("replaces the request headers schema, without mutating the original", () => {
      const base = RestEndpointConfig.create()
      const schema = z.object({ "x-request-id": z.string() })
      const updated = base.requestHeaders(schema)

      expect(updated.schemas.requestHeaders).toBe(schema)
      expect(base.schemas.requestHeaders.shape).toEqual({})
    })
  })

  describe("noRequestHeaders", () => {
    it("resets the request headers schema to an empty object", () => {
      const updated = RestEndpointConfig.create()
        .requestHeaders(z.object({ "x-request-id": z.string() }))
        .noRequestHeaders()

      expect(updated.schemas.requestHeaders.shape).toEqual({})
    })
  })

  describe("requestCookies", () => {
    it("replaces the request cookies schema, without mutating the original", () => {
      const base = RestEndpointConfig.create()
      const schema = z.object({ session: z.string() })
      const updated = base.requestCookies(schema)

      expect(updated.schemas.requestCookies).toBe(schema)
      expect(base.schemas.requestCookies.shape).toEqual({})
    })
  })

  describe("noRequestCookies", () => {
    it("resets the request cookies schema to an empty object", () => {
      const updated = RestEndpointConfig.create()
        .requestCookies(z.object({ session: z.string() }))
        .noRequestCookies()

      expect(updated.schemas.requestCookies.shape).toEqual({})
    })
  })

  describe("requestBody", () => {
    it("sets a custom request body reader", () => {
      class StubBodyReader extends RequestBodyReader<{ foo: string }> {
        readonly mimeType = mimeTypes.JSON

        constructor() {
          super("", undefined)
        }

        parse(): Promise<DataSanitizationResult<{ foo: string }>> {
          return Promise.resolve({ isValid: true, data: { foo: "bar" } })
        }
      }
      const reader = new StubBodyReader()
      const updated = RestEndpointConfig.create().requestBody(reader)

      expect(updated.requestBodyReader).toBe(reader)
    })
  })

  describe("jsonRequestBody", () => {
    it("sets a JsonBodyReader wrapping the given schema and description", () => {
      const schema = z.object({ id: z.number() })
      const updated = RestEndpointConfig.create().jsonRequestBody(schema, "My body")

      expect(updated.requestBodyReader).toBeInstanceOf(JsonBodyReader)
      expect((updated.requestBodyReader as JsonBodyReader<{ id: number }>).schema).toBe(schema)
      expect(updated.requestBodyReader.description).toEqual("My body")
    })
  })

  describe("noRequestBody", () => {
    it("resets the request body reader to the empty reader", () => {
      const updated = RestEndpointConfig.create()
        .jsonRequestBody(z.object({}))
        .noRequestBody()

      expect(updated.requestBodyReader).toBe(emptyBodyReader)
    })
  })

  describe("responseHeaders", () => {
    it("replaces the success response headers schema, without mutating the original", () => {
      const base = RestEndpointConfig.create()
      const schema = z.object({ "x-rate-limit": z.string() })
      const updated = base.responseHeaders(schema)

      expect(updated.schemas.successResponseHeaders).toBe(schema)
      expect(base.schemas.successResponseHeaders.shape).toEqual({})
    })
  })

  describe("noResponseHeaders", () => {
    it("resets the success response headers schema to an empty object", () => {
      const updated = RestEndpointConfig.create()
        .responseHeaders(z.object({ "x-rate-limit": z.string() }))
        .noResponseHeaders()

      expect(updated.schemas.successResponseHeaders.shape).toEqual({})
    })
  })

  describe("responseCookies", () => {
    it("replaces the success response cookies schema, without mutating the original", () => {
      const base = RestEndpointConfig.create()
      const cookieDef = { session: "Session ID" }
      const updated = base.responseCookies(cookieDef)

      expect(updated.successResponseCookies).toEqual(cookieDef)
      expect(base.successResponseCookies).toEqual({})
    })
  })

  describe("noResponseCookies", () => {
    it("resets the success response cookies schema to an empty object", () => {
      const updated = RestEndpointConfig.create()
        .responseCookies({ session: "Session ID" })
        .noResponseCookies()

      expect(updated.successResponseCookies).toEqual({})
    })
  })

  describe("responseBody", () => {
    it("sets custom success, error message and validation error writers", () => {
      const schema = z.object({ id: z.number() })
      const writer = new JsonResponseWriter(schema)
      const updated = RestEndpointConfig.create().responseBody(
        writer,
        jsonErrorMessageWriter,
        jsonValidationErrorWriter,
      )

      expect(updated.successResponseWriter).toBe(writer)
      expect(updated.errorMessageWriter).toBe(jsonErrorMessageWriter)
      expect(updated.validationErrorWriter).toBe(jsonValidationErrorWriter)
    })
  })

  describe("noResponseBody", () => {
    it("resets to the empty response writer with plain text error writers", () => {
      const updated = RestEndpointConfig.create()
        .jsonResponseBody(z.object({}))
        .noResponseBody()

      expect(updated.successResponseWriter).toBe(emptyResponseWriter)
      expect(updated.errorMessageWriter).toBe(textErrorMessageWriter)
      expect(updated.validationErrorWriter).toBe(textValidationErrorWriter)
    })
  })

  describe("jsonResponseBody", () => {
    it("sets a JsonResponseWriter and JSON error writers", () => {
      const schema = z.object({ id: z.number() })
      const updated = RestEndpointConfig.create().jsonResponseBody(schema, "My response")

      expect(updated.successResponseWriter).toBeInstanceOf(JsonResponseWriter)
      expect(updated.successResponseWriter.description).toEqual("My response")
      expect(updated.errorMessageWriter).toBe(jsonErrorMessageWriter)
      expect(updated.validationErrorWriter).toBe(jsonValidationErrorWriter)
    })
  })

  describe("xmlResponseBody", () => {
    it("sets an XMLResponseWriter and XML error writers", () => {
      const schema = z.object({ id: z.number() })
      const updated = RestEndpointConfig.create().xmlResponseBody(schema, "My response")

      expect(updated.successResponseWriter).toBeInstanceOf(XMLResponseWriter)
      expect(updated.successResponseWriter.description).toEqual("My response")
      expect(updated.errorMessageWriter).toBe(xmlErrorMessageWriter)
      expect(updated.validationErrorWriter).toBe(xmlValidationErrorWriter)
    })
  })

  describe("textResponseBody", () => {
    it("sets a TextResponseWriter and plain text error writers", () => {
      const updated = RestEndpointConfig.create().textResponseBody("My response")

      expect(updated.successResponseWriter).toBeInstanceOf(TextResponseWriter)
      expect(updated.successResponseWriter.description).toEqual("My response")
      expect(updated.errorMessageWriter).toBe(textErrorMessageWriter)
      expect(updated.validationErrorWriter).toBe(textValidationErrorWriter)
    })
  })

  describe("withErrorHandler", () => {
    it("sets a custom error handler and error response schemas", () => {
      const headersSchema = z.object({ "x-error-id": z.string() })
      const cookiesDef = {}
      const customHandler: ErrorHandler<{ "x-error-id": string }, Record<string, never>> = {
        handleBadRequest: (validationErrors) =>
          new BadRequestResponse({ "x-error-id": "1" }, {}, validationErrors),
        handleInternalError: () =>
          new InternalErrorResponse({ "x-error-id": "1" }, {}),
        handleUnauthenticated: () =>
          new UnauthenticatedResponse({ "x-error-id": "1" }, {}),
        handleUnauthorised: () =>
          new UnauthorisedResponse({ "x-error-id": "1" }, {}),
      }

      const updated = RestEndpointConfig.create().withErrorHandler(
        headersSchema,
        cookiesDef,
        customHandler,
      )

      expect(updated.errorHandler).toBe(customHandler)
      expect(updated.schemas.errorResponseHeaders).toBe(headersSchema)
      expect(updated.errorResponseCookies).toBe(cookiesDef)
    })
  })
})
