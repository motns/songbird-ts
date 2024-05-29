import { DataSanitizationResult } from "../../types/sanitization";

export abstract class DataSanitiser<In, Out> {
  abstract readonly codes: Record<string, string>
  abstract process(v?: In): DataSanitizationResult<Out>
}

export abstract class DataSanitiserAsync<In, Out> {
  abstract readonly codes: Record<string, string>
  abstract process(v: In): Promise<DataSanitizationResult<Out>>
}