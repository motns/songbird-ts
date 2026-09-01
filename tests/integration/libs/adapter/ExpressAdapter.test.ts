import { describe, it, expect } from "vitest";
import { z } from "zod";
import express from "express";
import type { AddressInfo } from "node:net";
import { ExpressAdapter } from "../../../../src/libs/adapter/ExpressAdapter.js";
import { RestEndpoint } from "../../../../src/libs/webservice/rest/RestEndpoint.js";
import { RestEndpointConfig } from "../../../../src/libs/webservice/rest/RestEndpointConfig.js";
import { noAuthenticator } from "../../../../src/libs/webservice/authentication/NoAuthenticator.js";
import { OkResponse } from "../../../../src/libs/webservice/response/OkResponse.js";
import { Cookie } from "../../../../src/libs/webservice/response/Cookie.js";
import type { AnyRestEndpoint, AnyRestEndpointConfig } from "../../../../src/types/webservice.js";
import type { HttpMethod } from "../../../../src/enums/http.js";
import cookieParser from "cookie-parser";

function createEndpoint(overrides: {
  method?: HttpMethod,
  endpointConfig?: AnyRestEndpointConfig,
  requestHandler?: any,
} = {}): AnyRestEndpoint {
  return new RestEndpoint({
    operationId: "testOp",
    docs: { endpointSummary: "Test", endpointDescription: "Test endpoint" },
    method: overrides.method ?? "get",
    endpointConfig: overrides.endpointConfig ?? RestEndpointConfig.create(),
    authenticator: noAuthenticator,
    requestHandler: overrides.requestHandler ?? (async () => new OkResponse(null, {}, {})),
  })
}

/**
 * Boots a real Express server with `endpoint` registered via `ExpressAdapter`, runs `run` against
 * it over real HTTP, then tears the server down.
 */
async function withServer(
  endpoint: AnyRestEndpoint,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = express()
  app.use(cookieParser())
  new ExpressAdapter(app).registerEndpoint(endpoint)

  const server = app.listen(0)
  await new Promise<void>((resolve) => server.once("listening", resolve))

  try {
    const { port } = server.address() as AddressInfo
    await run(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve())
    })
  }
}

describe("ExpressAdapter", () => {
  describe("registerEndpoint", () => {
    it("serves a JSON response over real HTTP, translating status, body and content-type", async () => {
      const endpoint = createEndpoint({
        endpointConfig: RestEndpointConfig.create().jsonResponseBody(z.object({ name: z.string() })),
        requestHandler: async () => new OkResponse({ name: "Ada" }, {}, {}),
      })

      await withServer(endpoint, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/`)

        expect(res.status).toBe(200)
        expect(res.headers.get("content-type")).toMatch(/^application\/json/)
        expect(await res.json()).toEqual({ name: "Ada" })
      })
    })

    it("only registers the route for the endpoint's configured HTTP method", async () => {
      const endpoint = createEndpoint({ method: "post" })

      await withServer(endpoint, async (baseUrl) => {
        const postRes = await fetch(`${baseUrl}/`, { method: "POST" })
        const getRes = await fetch(`${baseUrl}/`, { method: "GET" })

        expect(postRes.status).toBe(200)
        expect(getRes.status).toBe(404)
      })
    })

    it("lets the response writer's MIME type take precedence over any content-type set by the endpoint itself", async () => {
      const endpoint = createEndpoint({
        endpointConfig: RestEndpointConfig.create()
          .responseHeaders(z.object({ "content-type": z.string() }))
          .jsonResponseBody(z.object({ name: z.string() })),
        requestHandler: async () => new OkResponse({ name: "Ada" }, { "content-type": "text/plain" }, {}),
      })

      await withServer(endpoint, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/`)

        expect(res.headers.get("content-type")).toMatch(/^application\/json/)
      })
    })

    it("reads the raw request body and passes it through to the endpoint", async () => {
      const endpoint = createEndpoint({
        method: "post",
        endpointConfig: RestEndpointConfig.create()
          .jsonRequestBody(z.object({ content: z.string() }))
          .jsonResponseBody(z.object({ content: z.string() })),
        requestHandler: async (req: any) => new OkResponse({ content: req.body.content }, {}, {}),
      })

      await withServer(endpoint, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "hello" }),
        })

        expect(await res.json()).toEqual({ content: "hello" })
      })
    })

    it("sets a real Set-Cookie header for each cookie in the endpoint's response", async () => {
      const endpoint = createEndpoint({
        endpointConfig: RestEndpointConfig.create().responseCookies({ session: "Session ID" }),
        requestHandler: async () => new OkResponse(
          null,
          {},
          {
            session: new Cookie("session", "abc123", {
              httpOnly: true,
              path: "/",
              maxAge: 3600,
              secure: true,
            }),
          },
        ),
      })

      await withServer(endpoint, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/`)
        const cookies = res.headers.getSetCookie()

        expect(cookies).toHaveLength(1)
        expect(cookies[0]).toMatch(/^session=abc123;/)
        expect(cookies[0]).toMatch(/HttpOnly/)
        expect(cookies[0]).toMatch(/Secure/)
        expect(cookies[0]).toMatch(/Max-Age=3600/)
        expect(cookies[0]).toMatch(/Path=\//)
      })
    })

    it("does not set a Set-Cookie header when the endpoint's response has no cookies", async () => {
      const endpoint = createEndpoint()

      await withServer(endpoint, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/`)

        expect(res.headers.getSetCookie()).toEqual([])
      })
    })
  })
})
