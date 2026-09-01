import { describe, it, expect } from "vitest";
import { NoAuthenticator, noAuthenticator } from "../../../../../src/libs/webservice/authentication/NoAuthenticator.js";
import { RawRequest } from "../../../../../src/libs/webservice/request/RawRequest.js";

describe("NoAuthenticator", () => {
  const authenticator = new NoAuthenticator()

  it("always passes authentication, regardless of input", async () => {
    const req = new RawRequest(
      "get",
      "/api/v1/users",
      "123456",
      {},
      {},
      {},
      {},
      undefined,
      undefined,
    )

    const res = await authenticator.authenticate(req)
    expect(res.isValid).toEqual(true)
    expect(res.isAuthenticated).toEqual(true)
    if (res.isAuthenticated) {
      expect(res.output).toEqual(null)
    }
  })

  it("passes authentication even when headers, query params and cookies are present", async () => {
    const req = new RawRequest(
      "get",
      "/api/v1/users",
      "123456",
      { id: "1" },
      { search: "foo" },
      { "x-access-token": "12345" },
      { session: "abc" },
      undefined,
      undefined,
    )

    const res = await authenticator.authenticate(req)
    expect(res.isValid).toEqual(true)
    expect(res.isAuthenticated).toEqual(true)
    if (res.isAuthenticated) {
      expect(res.output).toEqual(null)
    }
  })

  it("exports a shared singleton instance", async () => {
    expect(noAuthenticator).toBeInstanceOf(NoAuthenticator)

    const req = new RawRequest(
      "get",
      "/api/v1/users",
      "123456",
      {},
      {},
      {},
      {},
      undefined,
      undefined,
    )

    const res = await noAuthenticator.authenticate(req)
    expect(res.isValid).toEqual(true)
    expect(res.isAuthenticated).toEqual(true)
  })
})
