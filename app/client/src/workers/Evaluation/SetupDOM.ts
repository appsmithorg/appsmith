//@ts-expect-error no types.
import * as documentMock from "linkedom/worker";

export const DOM_APIS = Object.keys(documentMock).reduce((acc, key) => {
  acc[key] = true;
  return acc;
}, {} as Record<string, true>);

export default function() {
  for (const [key, value] of Object.entries(documentMock)) {
    //@ts-expect-error no types
    self[key] = value;
  }
  const dom = documentMock.parseHTML(`<!DOCTYPE html><body></body>`);
  self.document = dom.window.document;
  self.window = dom.window;
}
