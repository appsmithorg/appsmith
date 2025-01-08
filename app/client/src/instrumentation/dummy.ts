import type { Attributes as OTELAttributes } from "@opentelemetry/api";
import type { Span } from "./types";
export type Attributes = OTELAttributes;

export interface DummyType {
  attributes: OTELAttributes;
  span: Span;
}
