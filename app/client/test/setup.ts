import { setupServer } from "msw/node";
import { handlers } from "./__mocks__/apiHandlers";
export const server = setupServer(...handlers);

window.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();
Element.prototype.scrollBy = jest.fn();
const mockObserveFn = () => {
  return {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  };
};

window.IntersectionObserver = jest.fn().mockImplementation(mockObserveFn);

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
Element.prototype.scrollTo = () => {};
