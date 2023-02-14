import * as _ from "../../../../support/Objects/ObjectsCore";

describe("peek overlay", () => {
  it("import app", () => {
    _.apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    _.apiPage.RunAPI();
    _.apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    _.jsEditor.CreateJSObject(
      `export default {
        numArray: [1, 2, 3],
        objectArray: [ {x: 123}, { y: "123"} ],
        objectData: { x: 123, y: "123" },
        nullData: null,
        myFun1: () => {
          this.numArray; JSObject1.objectData; this.nullData;
          Api2.data; Api1.data; Api1.run(); Api1.isLoading;
          appsmith.mode;
          appsmith.store.abc;
        },
        myFun2: async () => {
          storeValue("abc", 123)
          return Api1.run()
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        lineNumber: 0,
        prettify: false,
      },
    );
    _.jsEditor.SelectFunctionDropdown("myFun2");
    _.jsEditor.RunJSObj();

    _.peekOverlay.hoverCode("appsmith.store");
    _.peekOverlay.isOverlayOpen();

    // check if overlay closes
    _.peekOverlay.resetHover();
    _.peekOverlay.isOverlayOpen(false);

    // check number array - this keyword
    _.peekOverlay.hoverCode("JSObject1.numArray");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.checkPrimitveArrayInOverlay([1, 2, 3]);
    _.peekOverlay.resetHover();

    // check basic object - no this keyword
    _.peekOverlay.hoverCode("JSObject1.objectData");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.checkBasicObjectInOverlay({ x: 123, y: "123" });
    _.peekOverlay.resetHover();

    // check boolean
    _.peekOverlay.hoverCode("Api1.isLoading");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("boolean");
    _.peekOverlay.resetHover();

    // check string
    _.peekOverlay.hoverCode("appsmith.mode");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("string");
    _.peekOverlay.resetHover();

    // check undefined
    _.peekOverlay.hoverCode("Api2.data");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("undefined");
    _.peekOverlay.resetHover();
  });
});
