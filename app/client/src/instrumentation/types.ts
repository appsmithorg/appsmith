import type { TimeInput, Span as OTELSpan } from "@opentelemetry/api";
import type { Attributes as DummyAttributes } from "./dummy";

export interface WebworkerSpanData {
  attributes: DummyAttributes;
  spanName: string;
  startTime: TimeInput;
  endTime: TimeInput;
}

export type Span = OTELSpan;
export type Attributes = DummyAttributes;
