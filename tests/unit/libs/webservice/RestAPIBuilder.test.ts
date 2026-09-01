import { z } from "zod";
import { describe, it, expect } from "vitest";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { RestAPIBuilder } from "../../../../src/libs/webservice/RestAPIBuilder.js";
import { RestEndpoint } from "../../../../src/libs/webservice/rest/RestEndpoint.js";
import { RestEndpointConfig } from "../../../../src/libs/webservice/rest/RestEndpointConfig.js";
import { Authenticator } from "../../../../src/libs/webservice/authentication/Authenticator.js";
import { noAuthenticator } from "../../../../src/libs/webservice/authentication/NoAuthenticator.js";
import { OkResponse } from "../../../../src/libs/webservice/response/OkResponse.js";
import type { AuthenticationResult } from "../../../../src/types/authentication.js";
import type { AnyRestEndpointConfig } from "../../../../src/types/webservice.js";
import type { HttpMethod } from "../../../../src/enums/http.js";
import type { SecuritySchemeObject } from "openapi3-ts/oas31";
import type { PathItemObject } from "openapi3-ts/oas31";

// Required for `.openapi(refId)` to be available on Zod schemas - the production code never
// calls this itself, so tests that exercise ref-based schemas must extend Zod themselves.
extendZodWithOpenApi(z);

class BearerAuthenticator extends Authenticator<null> {
  constructor(name = "bearer-auth") {
    super(name, "Bearer authenticator");
  }

  async authenticate(): Promise<AuthenticationResult<null>> {
    return { isValid: true, isAuthenticated: true, output: null };
  }

  protected generateOpenApiDefinition(): SecuritySchemeObject | undefined {
    return { type: "http", scheme: "bearer" };
  }
}

function createEndpoint(overrides: {
  operationId?: string,
  method?: HttpMethod,
  authenticator?: Authenticator<any>,
  endpointConfig?: AnyRestEndpointConfig,
} = {}) {
  return new RestEndpoint({
    operationId: overrides.operationId ?? "getUsers",
    docs: { endpointSummary: "Get users", endpointDescription: "Returns a list of users" },
    method: overrides.method ?? "get",
    endpointConfig: overrides.endpointConfig ?? RestEndpointConfig.create(),
    authenticator: overrides.authenticator ?? noAuthenticator,
    requestHandler: async () => new OkResponse(null, {}, {}),
  });
}

describe("RestAPIBuilder", () => {
  describe("addEndpoint", () => {
    it("registers a single endpoint so it appears in the generated OpenAPI document", () => {
      const builder = new RestAPIBuilder("API", "Description", "1.0.0");
      builder.addEndpoint(createEndpoint());

      const doc = builder.generateOpenAPIDocument();
      const pathItem = doc.paths?.["/"] as PathItemObject | undefined;

      expect(pathItem?.get?.operationId).toEqual("getUsers");
    });

    it("registers a list of endpoints in a single call", () => {
      const builder = new RestAPIBuilder("API", "Description", "1.0.0");
      const listEndpoint = createEndpoint({ operationId: "listUsers", method: "get" });
      const createEndpointDef = createEndpoint({
        operationId: "createUser",
        method: "post",
        endpointConfig: RestEndpointConfig.create().route("/other", z.object({})),
      });

      builder.addEndpoint([listEndpoint, createEndpointDef]);

      const doc = builder.generateOpenAPIDocument();

      expect((doc.paths?.["/"] as PathItemObject | undefined)?.get?.operationId).toEqual("listUsers");
      expect((doc.paths?.["/other"] as PathItemObject | undefined)?.post?.operationId).toEqual("createUser");
    });

    it("throws when two endpoints are registered for the same method and path, even with different OperationIDs", () => {
      const builder = new RestAPIBuilder("API", "Description", "1.0.0");
      builder.addEndpoint(createEndpoint({ operationId: "getUsers" }));

      expect(() => builder.addEndpoint(createEndpoint({ operationId: "listUsers" })))
        .toThrow("Endpoint for route \"get /\" already exists");
    });

    it("throws when two endpoints share the same OperationID, even on different routes", () => {
      const builder = new RestAPIBuilder("API", "Description", "1.0.0");
      builder.addEndpoint(createEndpoint({ operationId: "getUsers" }));

      const otherRouteEndpoint = createEndpoint({
        operationId: "getUsers",
        endpointConfig: RestEndpointConfig.create().route("/other", z.object({})),
      });

      expect(() => builder.addEndpoint(otherRouteEndpoint))
        .toThrow("Endpoint with OperationID \"getUsers\" already exists");
    });

    it("throws when two request body schemas share an OpenAPI ref but are different Zod schemas", () => {
      const userSchema = z.object({ id: z.string() }).openapi("User");
      const otherUserSchema = z.object({ id: z.number() }).openapi("User");

      const builder = new RestAPIBuilder("API", "Description", "1.0.0");
      builder.addEndpoint(createEndpoint({
        operationId: "createUser",
        method: "post",
        endpointConfig: RestEndpointConfig.create().jsonRequestBody(userSchema),
      }));

      const conflictingEndpoint = createEndpoint({
        operationId: "createOtherUser",
        method: "post",
        endpointConfig: RestEndpointConfig.create().route("/other", z.object({})).jsonRequestBody(otherUserSchema),
      });

      expect(() => builder.addEndpoint(conflictingEndpoint))
        .toThrow("Schema reference \"User\" already exists with different Zod Schema");
    });

    it("throws when two success response schemas share an OpenAPI ref but are different Zod schemas", () => {
      const userSchema = z.object({ id: z.string() }).openapi("User");
      const otherUserSchema = z.object({ id: z.number() }).openapi("User");

      const builder = new RestAPIBuilder("API", "Description", "1.0.0");
      builder.addEndpoint(createEndpoint({
        operationId: "getUser",
        endpointConfig: RestEndpointConfig.create().jsonResponseBody(userSchema),
      }));

      const conflictingEndpoint = createEndpoint({
        operationId: "getOtherUser",
        endpointConfig: RestEndpointConfig.create().route("/other", z.object({})).jsonResponseBody(otherUserSchema),
      });

      expect(() => builder.addEndpoint(conflictingEndpoint))
        .toThrow("Schema reference \"User\" already exists with different Zod Schema");
    });

    it("allows the same Zod schema instance to be reused under the same ref across endpoints", () => {
      const userSchema = z.object({ id: z.string() }).openapi("User");

      const builder = new RestAPIBuilder("API", "Description", "1.0.0");
      builder.addEndpoint(createEndpoint({
        operationId: "createUser",
        method: "post",
        endpointConfig: RestEndpointConfig.create().jsonRequestBody(userSchema),
      }));

      const reusingEndpoint = createEndpoint({
        operationId: "getUser",
        endpointConfig: RestEndpointConfig.create().route("/other", z.object({})).jsonResponseBody(userSchema),
      });

      expect(() => builder.addEndpoint(reusingEndpoint)).not.toThrow();
    });

    it("registers a documented authenticator's security scheme once, even when reused across endpoints", () => {
      const authenticator = new BearerAuthenticator();
      const builder = new RestAPIBuilder("API", "Description", "1.0.0");

      builder.addEndpoint(createEndpoint({ operationId: "getUsers", authenticator }));
      builder.addEndpoint(createEndpoint({
        operationId: "getOtherUsers",
        authenticator,
        endpointConfig: RestEndpointConfig.create().route("/other", z.object({})),
      }));

      const doc = builder.generateOpenAPIDocument();

      expect(doc.components?.securitySchemes).toEqual({ "bearer-auth": { type: "http", scheme: "bearer" } });
    });

    it("does not register a security scheme for an authenticator without an OpenAPI definition", () => {
      const builder = new RestAPIBuilder("API", "Description", "1.0.0");
      builder.addEndpoint(createEndpoint({ authenticator: noAuthenticator }));

      const doc = builder.generateOpenAPIDocument();

      expect(doc.components?.securitySchemes).toBeUndefined();
    });

    it("throws when two authenticators share a name but have different OpenAPI security definitions", () => {
      const builder = new RestAPIBuilder("API", "Description", "1.0.0");
      builder.addEndpoint(createEndpoint({ operationId: "getUsers", authenticator: new BearerAuthenticator("shared-auth") }));

      const conflictingEndpoint = createEndpoint({
        operationId: "getOtherUsers",
        authenticator: new BearerAuthenticator("shared-auth"),
        endpointConfig: RestEndpointConfig.create().route("/other", z.object({})),
      });

      expect(() => builder.addEndpoint(conflictingEndpoint))
        .toThrow("Security scheme \"shared-auth\" is already defined with a different definition");
    });
  });

  describe("generateOpenAPIDocument", () => {
    it("includes the configured title, description and version", () => {
      const builder = new RestAPIBuilder("My API", "My API description", "2.4.1");
      builder.addEndpoint(createEndpoint());

      const doc = builder.generateOpenAPIDocument();

      expect(doc.openapi).toEqual("3.1.0");
      expect(doc.info).toEqual({ title: "My API", description: "My API description", version: "2.4.1" });
    });

    it("returns a document with no paths when no endpoints have been added", () => {
      const builder = new RestAPIBuilder("My API", "My API description", "1.0.0");

      const doc = builder.generateOpenAPIDocument();

      expect(doc.paths).toEqual({});
    });
  });

  // These tests must run last: RestAPIBuilder merges config overrides into a shared, module-level
  // default object via lodash's `_.merge`, which mutates that object in place - once a `false`
  // override has been used, every subsequently constructed RestAPIBuilder (even without an
  // override) sees `failOnDuplicateSchemaRef: false` instead of the true default.
  describe("config", () => {
    it("defaults failOnDuplicateSchemaRef to true", () => {
      const builder = new RestAPIBuilder("API", "Description", "1.0.0");

      expect(builder.config).toEqual({ failOnDuplicateSchemaRef: true });
    });

    it("skips the duplicate schema ref check when failOnDuplicateSchemaRef is overridden to false", () => {
      const userSchema = z.object({ id: z.string() }).openapi("User");
      const otherUserSchema = z.object({ id: z.number() }).openapi("User");

      const builder = new RestAPIBuilder("API", "Description", "1.0.0", { failOnDuplicateSchemaRef: false });
      builder.addEndpoint(createEndpoint({
        operationId: "createUser",
        method: "post",
        endpointConfig: RestEndpointConfig.create().jsonRequestBody(userSchema),
      }));

      const conflictingEndpoint = createEndpoint({
        operationId: "createOtherUser",
        method: "post",
        endpointConfig: RestEndpointConfig.create().route("/other", z.object({})).jsonRequestBody(otherUserSchema),
      });

      expect(() => builder.addEndpoint(conflictingEndpoint)).not.toThrow();
    });
  });
});
