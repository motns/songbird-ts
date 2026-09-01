import { AuthenticatorBase } from "./AuthenticatorBase.js";
import * as z from "zod";
import type { AuthenticationResult } from "../../../types/authentication.js";
import type { SecuritySchemeObject } from "openapi3-ts/oas31";

// oxlint-disable-next-line no-unused-vars
export class ApiKeyHeaderAuthenticator<Output, AuthHeader extends string> extends AuthenticatorBase<
  Record<string, never>,
  Record<string, never>,
  Record<AuthHeader, string>,
  Record<string, never>,
  Output
> {
  private readonly authHeader: string;

  constructor(
    name: string,
    description: string,
    authHeader: AuthHeader,
    handler: (
      pathParams: Record<string, never>,
      queryParams: Record<string, never>,
      headers: Record<AuthHeader, string>,
      cookies: Record<string, never>,
    ) => Promise<AuthenticationResult<Output>>,
  ) {
    super(
      name,
      description,
      z.object({}),
      z.object({}),
      z.object({
        [authHeader]: z.string(),
      }),
      z.object({}),
      handler,
      "Invalid or expired API Key",
    );

    this.authHeader = authHeader;
  }

  protected generateOpenApiDefinition(): SecuritySchemeObject | undefined {
    return {
      type: "apiKey",
      description: this.description,
      name: this.authHeader,
      in: "header",
    };
  }
}

// TODO - Example implementation here?
