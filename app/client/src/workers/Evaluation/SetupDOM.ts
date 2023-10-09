//@ts-expect-error no types.
import * as documentMock from "linkedom/worker";
declare const self: WorkerGlobalScope;

export default function () {
  for (const [key, value] of Object.entries(documentMock)) {
    self[key] = value;
  }
  const dom = documentMock.parseHTML(`<!DOCTYPE html><body></body>`);
  self.window = dom.window;
  self.document = dom.window.document;
  self.window = self;
}
