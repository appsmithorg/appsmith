import "@testing-library/jest-dom";

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
window.ResizeObserver = jest.fn().mockImplementation(mockObserveFn);

Element.prototype.scrollTo = () => {};
