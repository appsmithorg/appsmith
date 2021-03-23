import myLocalStorage from "utils/localStorage";

describe("local storage", () => {
  it("calls getItem", () => {
    jest.spyOn(window.localStorage.__proto__, "getItem");
    window.localStorage.__proto__.getItem = jest.fn();
    myLocalStorage.getItem("myTestKey");
    expect(localStorage.getItem).toBeCalledWith("myTestKey");
  });
  it("calls setItem", () => {
    jest.spyOn(window.localStorage.__proto__, "setItem");
    window.localStorage.__proto__.setItem = jest.fn();
    myLocalStorage.setItem("myTestKey", "testValue");
    expect(localStorage.setItem).toBeCalledWith("myTestKey", "testValue");
  });

  it("calls removeItem", () => {
    jest.spyOn(window.localStorage.__proto__, "removeItem");
    window.localStorage.__proto__.removeItem = jest.fn();
    myLocalStorage.removeItem("myTestKey");
    expect(localStorage.removeItem).toBeCalledWith("myTestKey");
  });
  it("calls clear", () => {
    jest.spyOn(window.localStorage.__proto__, "clear");
    window.localStorage.__proto__.clear = jest.fn();
    myLocalStorage.clear();
    expect(localStorage.clear).toBeCalled();
  });
});
