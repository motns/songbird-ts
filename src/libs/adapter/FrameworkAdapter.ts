import type { AnyRestEndpoint } from "../../types/webservice.js";

export abstract class FrameworkAdapter {
  abstract registerEndpoint(endpoint: AnyRestEndpoint): void
}
