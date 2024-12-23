import type { Attributes, TimeInput } from "@opentelemetry/api";

export interface WebworkerSpanData {
  attributes: Attributes;
  spanName: string;
  startTime: TimeInput;
  endTime: TimeInput;
}
