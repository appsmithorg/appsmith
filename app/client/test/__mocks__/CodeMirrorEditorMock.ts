export const MockCodemirrorEditor = {
  setOption: jest.fn(),
  options: {
    extraKeys: {},
  },
  getValue: jest.fn(),
  getCursor: jest.fn(),
  showHint: jest.fn(),
  getLine: jest.fn(),
  closeHint: jest.fn(),
  getRange: jest.fn(),
  getDoc: jest.fn(),
};

export const mockCodemirrorRender = () => {
  document.createRange = () => {
    const range = new Range();

    range.getBoundingClientRect = jest.fn();

    // @ts-expect-error: Types are not available
    range.getClientRects = jest.fn(() => ({
      item: () => null,
      length: 0,
    }));

    return range;
  };
};
