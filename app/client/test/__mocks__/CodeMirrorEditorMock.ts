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
