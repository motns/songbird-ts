import { describe, it, expect } from "vitest";
import { ApiKeyHeaderAuthenticator } from "../../../../../src/libs/webservice/authentication/ApiKeyHeaderAuthenticator.js";
import type { AuthenticationResult } from "../../../../../src/types/authentication.js";
import { RawRequest } from "../../../../../src/libs/webservice/request/RawRequest.js";

describe("ApiKeyHeaderAuthenticator", () => {
  const handlerFn = (
    _p: Record<string, never>,
    _q: Record<string, never>,
    headers: Record<"x-access-token", string>,
    _c: Record<string, never>
  ): Promise<AuthenticationResult<{ userId: number, role: string }>> => {
    if (headers["x-access-token"] === "12345") {
      return Promise.resolve({
        isValid: true,
        isAuthenticated: true,
        output: {
          userId: 12345,
          role: "admin"
        }
      })
    }

    return Promise.resolve({
      isValid: true,
      isAuthenticated: false,
      message: "Get that filthy token out of here!"
    })
  }

  const authenticator = new ApiKeyHeaderAuthenticator(
    "Access-Token Authentication",
    "Verifies that the client has a valid access token",
    "x-access-token",
    handlerFn
  )

  it("passes authentication on valid input", async () => {
    const req = new RawRequest(
      "get",
      "/api/v1/users",
      "123456",
      {},
      {},
      {
        "x-access-token": "12345"
      },
      {},
      undefined,
      undefined,
    )

    const res = await authenticator.authenticate(req)
    expect(res.isValid).toEqual(true)
    expect(res.isAuthenticated).toEqual(true)
    if (res.isAuthenticated) {
      expect(res.output).toEqual({
        userId: 12345,
        role: "admin"
      })
    }
  })

  it("fails authentication on invalid input", async () => {
    const req = new RawRequest(
      "get",
      "/api/v1/users",
      "123456",
      {},
      {},
      {
        "x-access-key": "12345"
      },
      {},
      undefined,
      undefined,
    )

    const res = await authenticator.authenticate(req)
    expect(res.isValid).toEqual(false)
    expect(res.isAuthenticated).toEqual(false)
    if (!res.isValid) {
      expect(res.validationErrors).toEqual({
        cookie: undefined,
        header: {
          properties: {
            "x-access-token": {
              errors: [{
                code: "invalid_type",
                message: "Invalid input: expected string, received undefined",
                params: {
                  expected: "string",
                }
              }]
            }
          },
        },
        pathParam: undefined,
        queryParam: undefined,
      })
    }
  })

  it("fails authentication on invalid access token", async () => {
    const req = new RawRequest(
      "get",
      "/api/v1/users",
      "123456",
      {},
      {},
      {
        "x-access-token": "7890123"
      },
      {},
      undefined,
      undefined,
    )

    const res = await authenticator.authenticate(req)
    expect(res.isValid).toEqual(true)
    expect(res.isAuthenticated).toEqual(false)
    if (res.isValid && !res.isAuthenticated) {
      expect(res.message).toEqual("Get that filthy token out of here!")
    }
  })
})