import * as documentMock from "linkedom/worker";

export default function () {
  for (const [key, value] of Object.entries(documentMock)) {
    //@ts-expect-error no types
    self[key] = value;
  }

  const dom = documentMock.parseHTML(`<!DOCTYPE html><body></body>`);

  self.window = dom.window;
  self.document = dom.window.document;
  self.window = self;
}
