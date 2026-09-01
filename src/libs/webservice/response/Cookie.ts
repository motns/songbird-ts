
export class Cookie<Name extends string> {
  readonly name: Name
  readonly value: string
  readonly path: string | undefined
  /**
   * Max age in seconds
   */
  readonly maxAge: number | undefined
  readonly domain: string | undefined
  readonly secure: boolean | undefined
  readonly httpOnly: boolean | undefined

  constructor(
    name: Name,
    value: string,
    options?: {
      path?: string,
      maxAge?: number,
      domain?: string,
      secure?: boolean,
      httpOnly?: boolean
    }
  ) {
    this.name = name
    this.value = value
    this.path = options?.path
    this.maxAge = options?.maxAge
    this.domain = options?.domain
    this.secure = options?.secure
    this.httpOnly = options?.httpOnly
  }
}