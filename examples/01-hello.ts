import * as z from "zod";
import express from "express";
import {
  ExpressAdapter,
  httpMethod,
  noAuthenticator,
  OkResponse,
  RestAPIBuilder,
  RestEndpoint,
  RestEndpointConfig,
} from "../src/index.js";
import { capitalize } from "remeda";

/**
 * An EndpointConfig contains basic information around your endpoint, such as:
 * - route with parameters (/greet/:name)
 * - request/response MIME type
 * - expected request/response body validation schemas
 * - expected request/response cookies and headers
 *
 * RestEndpointConfigs are immutable, so each method call returns a new instance - this makes them
 * safe to pass around and build upon as needed.
 *
 * OpenAPI metadata can be provided via the `.meta()` method on Zod schemas.
 */
const endpointConfig = RestEndpointConfig.create()
  .route(
    "/greet/:name", // Express style path parameters are supported
    z.object({
      // When setting a new route, you need to provide a ZodSchema to validate the path parameters
      name: z.string().min(2).meta({
        // Provide OpenAPI metadata
        description: "The name to greet",
        example: "Peter",
      }),
    }),
  )
  .jsonResponseBody(
    z.string().meta({
      description: "The greeting",
      example: "Hello Peter!",
    }),
  );

/**
 * A RestEndpoint takes a RestEndpointConfig and turns it into a route by taking an additional
 * HTTP method and a request handler.
 * Finally, it also requires some OpenAPI specific information to be provided, such as the OperationID
 * and endpoint summary/description.
 */
const endpoint = new RestEndpoint({
  operationId: "getGreet",
  docs: {
    endpointSummary: "Say hello",
    endpointDescription: "Return a greeting for the specified name",
  },
  method: httpMethod.GET,
  endpointConfig,
  authenticator: noAuthenticator, // You have to explicitly provide an authenticator for safety, even when no auth is being done
  /**
   * The actual request handler. It receives an instance of `SanitizedRequest`, which contains all the
   * sanitised versions of path and query parameters, headers, and the request body. It must return an
   * `OkResponse` at the end, since all expected error conditions should have been handled by upstream
   * validation, authentication, and authorisation handlers (more on these later).
   * If any unexpected conditions occur in the handler, it should throw an Error to abort.
   */
  requestHandler: async (req) => {
    const name = capitalize(req.pathParams.name);
    return new OkResponse(`Hello ${name}!`, {}, {});
  },
});

/**
 * A RestAPIBuilder is where all endpoints are accumulated and bound to a framework adapter.
 * It also checks for duplicate routes, Operation IDs, and Schema Refs.
 */
const restApiBuilder = new RestAPIBuilder("Friendly API", "Baby's first Songbird API", "1.0.0");
restApiBuilder.addEndpoint(endpoint);

/**
 * Songbird comes with built-in support for Express, but additional frameworks can be added
 * by implementing the FrameworkAdapter interface.
 */
const app = express();
const adapter = new ExpressAdapter(app);
restApiBuilder.bindEndpoints(adapter);

/**
 * You can get the OpenAPI spec as a typed object from the RestAPIBuilder
 */
const openApiSpec = restApiBuilder.generateOpenAPIDocument();
app.get("/openapi", (_req, res) => {
  res.send(openApiSpec);
});

app.listen(3000, () => console.log("Server listening on http://localhost:3000"));
