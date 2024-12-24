import type {
  Attributes as OTELAttributes,
  TimeInput,
  Span as OTELSpan,
} from "@opentelemetry/api";

export interface WebworkerSpanData {
  attributes: OTELAttributes;
  spanName: string;
  startTime: TimeInput;
  endTime: TimeInput;
}

export type Attributes = OTELAttributes;
export type Span = OTELSpan;
