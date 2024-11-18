import { setupServer } from "msw/node";
import { handlers } from "./__mocks__/apiHandlers";
import "../src/polyfills/requestIdleCallback";
import { Crypto } from "@peculiar/webcrypto";

global.crypto = new Crypto();

export const server = setupServer(...handlers);

jest.mock("api/Api", () => ({
  __esModule: true,
  default: class Api { },
}));

window.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();
Element.prototype.scrollBy = jest.fn();

jest.mock("../src/api/Api.ts", () => ({
  __esModule: true,
  default: class Api { },
}));

// Polyfill for `structuredClone` if not available
if (typeof global.structuredClone === "undefined") {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

beforeAll(() => {
  window.IntersectionObserver = jest
    .fn()
    .mockImplementation((fn: (entry: any) => any) => {
      return {
        observe: () => {
          fn([
            {
              isIntersecting: true,
              boundingClientRect: {
                top: 64,
                left: 293,
              },
              intersectionRect: {
                width: 1296,
                height: 424,
                top: 64,
                left: 293,
              },
            },
          ]);
        },
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

  window.ResizeObserver = jest.fn().mockImplementation(() => {
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
  });
});

// establish API mocking before all tests
beforeAll(() => server.listen());
// reset any request handlers that are declared as a part of our tests
// (i.e. for testing one-time error scenarios)
afterEach(() => server.resetHandlers());
// clean up once the tests are done
afterAll(() => server.close());

// popper.js fix for jest tests
document.createRange = () => {
  const range = new Range();

  range.getBoundingClientRect = jest.fn();

  range.getClientRects = () => {
    return {
      item: () => null,
      length: 0,
      [Symbol.iterator]: jest.fn(),
    };
  };

  return range;
};

// jest events doesnt seem to be handling scrollTo
Element.prototype.scrollTo = () => { };

class WorkerStub {
  url: string;
  onmessage: CallableFunction;
  constructor(stringUrl: string) {
    this.url = stringUrl;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.onmessage = () => { };
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
}

window.Worker = WorkerStub as any;
