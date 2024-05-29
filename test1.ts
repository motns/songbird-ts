import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { RestEndpointDef } from "./src/libs/webservice/rest/RestEndpointDef";
import { JsonResponseWriter } from "./src/libs/webservice/response/writer/JsonResponseWriter";
import { RestEndpoint } from "./src/libs/webservice/rest/RestEndpoint";
import { noAuthenticator } from "./src/libs/webservice/authentication/NoAuthenticator";
import { RestAPIBuilder } from "./src";

extendZodWithOpenApi(z)

const os = z.object({
  id: z.number(),
  userId: z.number(),
  //createdAt: z.date(),
  total: z.number()
}).openapi(
  "Order",
  {
    description: "A full Order object",
    example: {
      id: 1234,
      userId: 5678,
      //createdAt: new Date(),
      total: 120
    }
  }
)

const ed = RestEndpointDef
  .create()
  .route(
    "/orders/:orderId<number>",
    z.object({
      orderId: z.number()
    })
  ).responseBody(
    new JsonResponseWriter(os)
  )

const handler: () => Promise<{ body: z.infer<typeof os>, headers: {}}> = (): Promise<{ body: z.infer<typeof os>, headers: {}}> => {
  return Promise.resolve({
    body: {
      id: 4321,
      userId: 8765,
      createdAt: new Date(),
      total: 120
    },
    headers: {}
  })
}

const ep = new RestEndpoint(
  "getOrderById",
  {
    endpointSummary: "Get Order By ID",
    endpointDescription: "Returns the full Order details if an order is found, or null otherwise",
  },
  "get",
  ed,
  noAuthenticator,
  async () => {
    return {
      body: {
        id: 4321,
        userId: 8765,
        //createdAt: new Date(),
        total: 120
      },
      headers: {}
    }
  }
)

const api = new RestAPIBuilder(
  "Test API",
  "Songbird first test",
  "0.0.1"
)

api.addEndpoint(ep)

const doc = api.generateOpenAPIDocument()

console.log(JSON.stringify(doc, null, 2))
