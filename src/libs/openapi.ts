import { z, ZodTypeAny } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z)

/**
 * This is a hacky way of getting a hold of the reference name assigned to a Zod Schema
 * for OpenAPI documentation purposes. The zod-to-openapi library uses it internally to
 * auto-register schemas under `components/schemas` if they appear in the OpenAPI object.
 *
 * @param s ZodSchema to get the reference for
 */
export function getOpenApiRef(s: ZodTypeAny): string | undefined {
  return s._def.openapi?._internal?.refId
}