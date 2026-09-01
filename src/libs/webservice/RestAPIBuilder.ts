import type { AnyRestEndpoint } from "../../types/webservice.js";
import { JsonResponseWriter } from "./response/writer/JsonResponseWriter.js";
import { XMLResponseWriter } from "./response/writer/XMLResponseWriter.js";
import { z } from "zod";
import { JsonBodyReader } from "./request/reader/JsonBodyReader.js";
import { mergeDeep, values } from "remeda";
import { getRefId, OpenApiGeneratorV31, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject, SecuritySchemeObject } from "openapi3-ts/oas31";
import type { FrameworkAdapter } from "../adapter/FrameworkAdapter.js";

export type RestAPIBuilderConfig = {
  /**
   * Fail if two or more Zod Schemas have the same ref name
   * applied to them via `.openapi(ref)`
   */
  failOnDuplicateSchemaRef: boolean;
};

const defaultConfig: RestAPIBuilderConfig = {
  failOnDuplicateSchemaRef: true,
};

export class RestAPIBuilder {
  readonly config: RestAPIBuilderConfig;

  /**
   * Rest endpoints by OperationID, used for checking duplicate OperationIDs
   * and for generating the OpenAPI documentation at the end.
   * @private
   */
  private endpointByOperationId: Record<string, AnyRestEndpoint> = {};

  /**
   * Set of OpenAPI Operation paths, used for checking that two or more Operations
   * aren't registered to the same method+path combination.
   * @private
   */
  private routeSet: Set<string> = new Set();

  /**
   * Zod Schemas by ref name, used to make sure that two or more Zod Schemas do not
   * have the same ref name assigned to them.
   * @private
   */
  private schemaByRef: Record<string, z.ZodType> = {};

  private securitySchemeByName: Record<string, SecuritySchemeObject> = {};

  /**
   * Rest API title used in OpenAPI documentation
   * @private
   */
  private readonly title: string;

  /**
   * Rest API long description used in OpenAPI documentation
   * @private
   */
  private readonly description: string;

  /**
   * Version number for this Rest API, used in OpenAPI documentation
   * @private
   */
  private readonly version: string;

  /**
   * OpenAPI Registry object - used by OpenAPI document generator
   * @private
   */
  private readonly registry: OpenAPIRegistry = new OpenAPIRegistry();

  constructor(
    title: string,
    description: string,
    version: string,
    configOverride?: Partial<RestAPIBuilderConfig>,
  ) {
    this.title = title;
    this.description = description;
    this.version = version;
    this.config = mergeDeep(defaultConfig, configOverride ?? {}) as RestAPIBuilderConfig;
  }

  addEndpoint(endpoint: AnyRestEndpoint): void;
  addEndpoint(endpointList: AnyRestEndpoint[]): void;
  addEndpoint(endpointOrList: AnyRestEndpoint | AnyRestEndpoint[]) {
    const endpoints: AnyRestEndpoint[] = Array.isArray(endpointOrList)
      ? endpointOrList
      : [endpointOrList];

    endpoints.forEach((endpoint) => {
      const routeKey = `${endpoint.method} ${endpoint.config.openApiPath}`;

      if (this.routeSet.has(routeKey)) {
        throw new RestAPIBuilderError(`Endpoint for route "${routeKey}" already exists`);
      }
      this.routeSet.add(routeKey);

      if (this.endpointByOperationId[endpoint.operationId]) {
        throw new RestAPIBuilderError(
          `Endpoint with OperationID "${endpoint.operationId}" already exists`,
        );
      }

      if (endpoint.config.requestBodyReader instanceof JsonBodyReader) {
        this.checkSchemaRef(endpoint.config.requestBodyReader.schema);
      }

      if (
        endpoint.config.successResponseWriter instanceof JsonResponseWriter ||
        endpoint.config.successResponseWriter instanceof XMLResponseWriter
      ) {
        this.checkSchemaRef(endpoint.config.successResponseWriter.schema);
      }

      if (endpoint.authenticator.openApiDefinition) {
        if (this.securitySchemeByName[endpoint.authenticator.name]) {
          if (
            this.securitySchemeByName[endpoint.authenticator.name] !==
            endpoint.authenticator.openApiDefinition
          ) {
            throw new RestAPIBuilderError(
              `Security scheme "${endpoint.authenticator.name}" is already defined with a different definition`,
            );
          }
        } else {
          this.registry.registerComponent(
            "securitySchemes",
            endpoint.authenticator.name,
            endpoint.authenticator.openApiDefinition,
          );

          this.securitySchemeByName[endpoint.authenticator.name] =
            endpoint.authenticator.openApiDefinition;
        }
      }

      this.endpointByOperationId[endpoint.operationId] = endpoint;
      this.registry.registerPath(endpoint.openApiDefinition);
    });
  }

  generateOpenAPIDocument(): OpenAPIObject {
    return new OpenApiGeneratorV31(this.registry.definitions).generateDocument({
      openapi: "3.1.0",
      info: {
        version: this.version,
        title: this.title,
        description: this.description,
      },
    });
  }

  bindEndpoints(adapter: FrameworkAdapter): void {
    values(this.endpointByOperationId).forEach((endpoint) => {
      adapter.registerEndpoint(endpoint);
    });
  }

  /**
   * The zod-to-openapi library auto-registers Zod schemas under `components/schemas` if a
   * reference name has been specified via the `.openapi()` method. However, instead of checking for
   * duplicate references in use for different schemas, they do some funky merging under the hood
   * and output that via "allOf" - while this is technically correct, using the same name for different
   * schemas is most likely a mistake, so it's better to highlight it to the developer.
   *
   * @param schema
   * @private
   */
  private checkSchemaRef(schema: z.ZodType): void {
    if (!this.config.failOnDuplicateSchemaRef) {
      return;
    }

    const ref = getRefId(schema);

    if (ref) {
      if (this.schemaByRef[ref]) {
        if (this.schemaByRef[ref] !== schema) {
          throw new RestAPIBuilderError(
            `Schema reference "${ref}" already exists with different Zod Schema`,
          );
        }
      } else {
        this.schemaByRef[ref] = schema;
      }
    }
  }
}

class RestAPIBuilderError extends Error {}
