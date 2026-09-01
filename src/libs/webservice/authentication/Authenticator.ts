import type { AuthenticationResult } from "../../../types/authentication.js";
import type { SecuritySchemeObject } from "openapi3-ts/oas31";
import { RawRequest } from "../request/RawRequest.js";

export abstract class Authenticator<Output> {
  /**
   * Unique name for this authenticator, to be used as the key for this definition under SecuritySchemes,
   * and also to refer to it under SecurityRequirements in each Operation object
   */
  readonly name: string

  /**
   * Description to be included in the OpenAPI definition for this authenticator under SecuritySchemes
   */
  readonly description: string

  /**
   * Error message which will be returned if authentication via this Authenticator fails
   */
  readonly errorMessage: string

  /**
   * OpenAPI definition for this Authenticator, to be added under SecuritySchemes
   */
  readonly openApiDefinition?: SecuritySchemeObject | undefined

  protected constructor(
    name: string,
    description: string,
    errorMessage?: string,
  ) {
    this.name = name
    this.description = description
    this.errorMessage = errorMessage || "Authentication failed"
    this.openApiDefinition = this.generateOpenApiDefinition();
  }

  abstract authenticate(req: RawRequest): Promise<AuthenticationResult<Output>>

  protected abstract generateOpenApiDefinition(): SecuritySchemeObject | undefined
}
