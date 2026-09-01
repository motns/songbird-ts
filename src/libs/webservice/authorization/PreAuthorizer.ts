/**
 * Wraps a handler to perform authorisation after request authentication, but *before* request validation;
 * hence it won't have any of the request data available yet.
 * A second phase of authorisation may take place later, after request validation, via an `Authorizer`.
 */
export class PreAuthorizer<AuthenticatorOutput> {
  /**
   * @public Handler function which decides whether the request may proceed as (pre)authorized
   */
  protected readonly handler: (auth: AuthenticatorOutput) => boolean

  /**
   * @public List of scopes which are authorised - used for documentation purposes only.
   * Technically, this only applies to OAuth Security Schemes in OpenAPI, but we'll include
   * it for other schemes as well in the documentation if provided.
   */
  readonly scopes: string[] = []

  constructor(
    handler: (auth: AuthenticatorOutput) => boolean,
    scopes: string[] = []
  ) {
    this.handler = handler
    this.scopes = scopes
  }

  isAuthorized(auth: AuthenticatorOutput): boolean {
    return this.handler(auth);
  }
}
