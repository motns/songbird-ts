import { AuthenticatorBase } from "./AuthenticatorBase.js";
import * as z from "zod";
import type { AuthenticationResult } from "../../../types/authentication.js";
import { httpRequestHeader } from "../../../enums/http.js";
import type { SecuritySchemeObject } from "openapi3-ts/oas31";


// oxlint-disable-next-line no-unused-vars
export class BearerTokenAuthenticator<
  Output
> extends AuthenticatorBase<
  Record<string, never>,
  Record<string, never>,
  Record<typeof httpRequestHeader.AUTHORIZATION, string>,
  Record<string, never>,
  Output
> {
  constructor(
    name: string,
    description: string,
    handler: (
      pathParams: {},
      queryParams: {},
      headers: { [httpRequestHeader.AUTHORIZATION]: string },
      cookies: {},
    ) => Promise<AuthenticationResult<Output>>
  ) {
    super(
      name,
      description,
      z.object({}),
      z.object({}),
      z.object({
        [httpRequestHeader.AUTHORIZATION]: z.string()
      }),
      z.object({}),
      handler,
      "Invalid or expired Bearer Token"
    )
  }

  protected generateOpenApiDefinition(): SecuritySchemeObject | undefined {
    return {
      type: "http",
      description: this.description,
      scheme: "bearer"
    };
  }
}
