import { FrameworkAdapter } from "./FrameworkAdapter.js";
import type { AnyRestEndpoint } from "../../types/webservice.js";
import type { Express, Request, Response } from "express";
import express from "express";
import { RawRequest } from "../webservice/request/RawRequest.js";
import { httpMethodFromStr, httpRequestHeader } from "../../enums/http.js";
import { forEachObj, isArray, isEmpty, mapValues } from "remeda";

export class ExpressAdapter extends FrameworkAdapter {
  private readonly express: Express

  constructor(express: Express) {
    super()
    this.express = express
  }

  override registerEndpoint(endpoint: AnyRestEndpoint): void {
    this.express[endpoint.method]!(
      endpoint.config.expressRoute,
      express.raw({ type: "*/*", limit: "10mb"}), // TODO: Make limit configurable
      async (req: Request, res: Response) => {
        const songbirdRequest = new RawRequest(
          httpMethodFromStr(req.method),
          req.url,
          "", // TODO
          mapValues(req.params, (v) => {
            if (isArray(v)) return v.join("/")
            return v
          }),
          req.query,
          req.headers,
          req.cookies ?? {}, // TODO - will need to check the actual format of this
          new Blob([req.body]),
          {}
        )

        const result = await endpoint.processRequest(songbirdRequest)

        if (!isEmpty(result.response.cookies)) {
          forEachObj(result.response.cookies, (cookie) => {
            res.cookie(
              cookie.name,
              cookie.value,
              {
                domain: cookie.domain,
                httpOnly: cookie.httpOnly,
                maxAge: cookie.maxAge && cookie.maxAge * 1000, // Express expects milliseconds
                path: cookie.path,
                secure: cookie.secure,
              }
            )
          })
        }

        res
          .status(result.response.httpStatus)
          .set({
            ...result.response.headers,
            [httpRequestHeader.CONTENT_TYPE]: result.writer.mimeType
          })
          .send(result.serialiseBody())
      }
    )
  }
}