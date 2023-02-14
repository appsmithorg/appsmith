import * as _ from "../../../../support/Objects/ObjectsCore";

describe("peek overlay", () => {
  it("main test", () => {
    (cy as any).dragAndDropToCanvas("tablewidgetv2", { x: 500, y: 100 });
    _.apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    _.apiPage.RunAPI();
    _.apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    _.jsEditor.CreateJSObject(
      `export default {
        numArray: [1, 2, 3],
        objectArray: [ {x: 123}, { y: "123"} ],
        objectData: { x: 123, y: "123" },
        nullData: null,
        numberData: 1,
        myFun1: () => {
          this.numArray; JSObject1.objectData; this.nullData; JSObject1.numberData;
          Api1.run(); Api1.isLoading; Api2.data;
          appsmith.mode; appsmith.store.abc;
          Table1.pageNo; Table1.tableData;
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
        prettify: true,
      },
    );
    _.jsEditor.SelectFunctionDropdown("myFun2");
    _.jsEditor.RunJSObj();
    _.agHelper.Sleep();

    // check number array - this keyword
    _.peekOverlay.hoverCode("JSObject1.numArray");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("array");
    _.peekOverlay.checkPrimitveArrayInOverlay([1, 2, 3]);
    _.peekOverlay.resetHover();

    // check basic object - no this keyword
    _.peekOverlay.hoverCode("JSObject1.objectData");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("object");
    _.peekOverlay.checkBasicObjectInOverlay({ x: 123, y: "123" });
    _.peekOverlay.resetHover();

    // check null
    _.peekOverlay.hoverCode("JSObject1.nullData");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("null");
    _.peekOverlay.checkPrimitiveData("null");
    _.peekOverlay.resetHover();

    // check number
    _.peekOverlay.hoverCode("JSObject1.numberData");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("number");
    _.peekOverlay.checkPrimitiveData("1");
    _.peekOverlay.resetHover();

    // check undefined
    _.peekOverlay.hoverCode("Api2.data");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("undefined");
    _.peekOverlay.checkPrimitiveData("undefined");
    _.peekOverlay.resetHover();

    // check boolean
    _.peekOverlay.hoverCode("Api1.isLoading");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("boolean");
    _.peekOverlay.checkPrimitiveData("false");
    _.peekOverlay.resetHover();

    // check function
    _.peekOverlay.hoverCode("Api1.run");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("function");
    _.peekOverlay.checkPrimitiveData("function () {}");
    _.peekOverlay.resetHover();

    // check string
    _.peekOverlay.hoverCode("appsmith.mode");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("string");
    _.peekOverlay.checkPrimitiveData("EDIT");
    _.peekOverlay.resetHover();

    // check if overlay closes
    _.peekOverlay.hoverCode("appsmith.store");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.resetHover();
    _.peekOverlay.isOverlayOpen(false);

    // widget object
    _.peekOverlay.hoverCode("Table1");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("object");
    _.peekOverlay.resetHover();

    // widget property
    _.peekOverlay.hoverCode("Table1.pageNo");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("number");
    _.peekOverlay.checkPrimitiveData("1");
    _.peekOverlay.resetHover();

    // widget property
    _.peekOverlay.hoverCode("Table1.tableData");
    _.peekOverlay.isOverlayOpen();
    _.peekOverlay.verifyDataType("array");
    _.peekOverlay.checkObjectArrayInOverlay([{}, {}, {}]);
    _.peekOverlay.resetHover();
  });
});
