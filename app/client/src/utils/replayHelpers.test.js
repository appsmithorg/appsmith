import { shouldDisallowToast } from "./replayHelpers";

describe("Checks ReplayDSL functionality", () => {
  var localStorage = {};
  localStorage.setItem = function(key, val) {
    this[key] = val + "";
  };
  localStorage.getItem = function(key) {
    return this[key];
  };
  Object.defineProperty(localStorage, "length", {
    get: function() {
      return Object.keys(this).length - 2;
    },
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("checks shouldDisallowToast", () => {
    localStorage.setItem("undoToastShown", false);
    localStorage.setItem("redoToastShown", false);

    let test1 = shouldDisallowToast(false);
    let test2 = shouldDisallowToast(true);

    expect(test1).toBe(false);
    expect(test2).toBe(false);

    localStorage.setItem("undoToastShown", true);
    localStorage.setItem("redoToastShown", true);

    test1 = shouldDisallowToast(false);
    test2 = shouldDisallowToast(true);

    expect(test1).toBe(true);
    expect(test2).toBe(true);
  });
});
