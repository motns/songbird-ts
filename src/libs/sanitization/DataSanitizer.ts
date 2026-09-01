import type { DataSanitizationResult } from "../../types/sanitization.js";

export abstract class DataSanitizer<In, Out, ErrorCodes extends string> {
  abstract readonly codes: ErrorCodes[]
  abstract process(v?: In): DataSanitizationResult<Out>
}

export abstract class DataSanitizerAsync<In, Out, ErrorCodes extends string> {
  abstract readonly codes: ErrorCodes[]
  abstract process(v: In): Promise<DataSanitizationResult<Out>>
}