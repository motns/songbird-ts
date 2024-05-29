import { AuthenticationResult } from "../../../types/authentication";
import { SecuritySchemeObject } from "openapi3-ts/oas31";
import { SongbirdRawRequest } from "../request/SongbirdRawRequest";

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
  readonly openApiDefinition?: SecuritySchemeObject

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

  abstract authenticate(req: SongbirdRawRequest): Promise<AuthenticationResult<Output>>

  protected abstract generateOpenApiDefinition(): SecuritySchemeObject | undefined
}
