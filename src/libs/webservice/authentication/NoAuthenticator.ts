import { AuthenticatorBase } from "./AuthenticatorBase.js";
import { z } from "zod";
import type { SecuritySchemeObject } from "openapi3-ts/oas31";

/**
 * This Authenticator is used to explicitly mark public endpoints, but it will not be added anywhere
 * in the OpenAPI output - instead we'll just put an empty array under SecurityRequirements for the Operation.
 */
export class NoAuthenticator extends AuthenticatorBase<{}, {}, {}, {}, null> {
  constructor() {
    super(
      "noauth",
      "", // Leave this blank, since it will never be added to the OpenAPI definition
      z.object({}),
      z.object({}),
      z.object({}),
      z.object({}),
      () => {
        return Promise.resolve({
          isValid: true,
          isAuthenticated: true,
          output: null,
        });
      },
    );
  }

  protected generateOpenApiDefinition(): SecuritySchemeObject | undefined {
    return undefined; // This is a special case where we perform no authentication, hence no definition either
  }
}

export const noAuthenticator = new NoAuthenticator();
