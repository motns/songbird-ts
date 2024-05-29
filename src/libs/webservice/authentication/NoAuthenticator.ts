import { AuthenticatorBase } from "./AuthenticatorBase";
import { z, ZodObject } from "zod";
import { SecuritySchemeObject, SecuritySchemeType } from "openapi3-ts/src/model/openapi31";

/**
 * This Authenticator is used to explicitly mark public endpoints, but it will not be added anywhere
 * in the OpenAPI output - instead we'll just put an empty array under SecurityRequirements for the Operation.
 */
export class NoAuthenticator extends AuthenticatorBase<ZodObject<{}>, ZodObject<{}>, ZodObject<{}>, null> {
  readonly queryParamsSchema = z.object({})
  readonly headersSchema = z.object({})
  readonly cookiesSchema = z.object({})
  readonly securitySchemeType: SecuritySchemeType = "http" // dummy value

  constructor() {
    super(
      "noauth",
      "", // Leave this blank, since it will never be added to the OpenAPI definition
      () => {
        return Promise.resolve({
          isValid: true,
          isAuthenticated: true,
          output: null
        })
      }
    )
  }

  protected generateOpenApiDefinition(): SecuritySchemeObject | undefined {
    return undefined; // This is a special case where we perform no authentication, hence no definition either
  }
}

export const noAuthenticator = new NoAuthenticator()