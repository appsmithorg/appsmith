import * as _ from "../../../../support/Objects/ObjectsCore";

describe("peek overlay", () => {
  it("main test", () => {
    cy.fixture("datasources").then((datasourceFormData: any) => {
      _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 500, 100);
      _.apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"]);
      _.apiPage.RunAPI();
      _.apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"]);
      _.jsEditor.CreateJSObject(
        `export default {
        numArray: [1, 2, 3],
        objectArray: [ {x: 123}, { y: "123"} ],
        objectData: { x: 123, y: "123" },
        nullData: null,
        numberData: 1,
        myFun1: () => {
          // TODO: handle this keyword failure on CI tests
          JSObject1.numArray; JSObject1.objectData; JSObject1.nullData; JSObject1.numberData;
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

      // check number array
      _.peekOverlay.HoverCode("JSObject1.numArray");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("array");
      _.peekOverlay.CheckPrimitveArrayInOverlay([1, 2, 3]);
      _.peekOverlay.ResetHover();

      // check basic object
      _.peekOverlay.HoverCode("JSObject1.objectData");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("object");
      _.peekOverlay.CheckBasicObjectInOverlay({ x: 123, y: "123" });
      _.peekOverlay.ResetHover();

      // check null - with this keyword
      _.peekOverlay.HoverCode("JSObject1.nullData");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("null");
      _.peekOverlay.CheckPrimitiveValue("null");
      _.peekOverlay.ResetHover();

      // check number
      _.peekOverlay.HoverCode("JSObject1.numberData");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("number");
      _.peekOverlay.CheckPrimitiveValue("1");
      _.peekOverlay.ResetHover();

      // check undefined
      _.peekOverlay.HoverCode("Api2.data");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("undefined");
      _.peekOverlay.CheckPrimitiveValue("undefined");
      _.peekOverlay.ResetHover();

      // check boolean
      _.peekOverlay.HoverCode("Api1.isLoading");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("boolean");
      _.peekOverlay.CheckPrimitiveValue("false");
      _.peekOverlay.ResetHover();

      // TODO: handle this function failure on CI tests -> "function(){}"
      // check function
      // _.peekOverlay.HoverCode("Api1.run");
      // _.peekOverlay.IsOverlayOpen();
      // _.peekOverlay.VerifyDataType("function");
      // _.peekOverlay.CheckPrimitiveValue("function () {}");
      // _.peekOverlay.ResetHover();

      // check string
      _.peekOverlay.HoverCode("appsmith.mode");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("string");
      _.peekOverlay.CheckPrimitiveValue("EDIT");
      _.peekOverlay.ResetHover();

      // check if overlay closes
      _.peekOverlay.HoverCode("appsmith.store");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.ResetHover();
      _.peekOverlay.IsOverlayOpen(false);

      // widget object
      _.peekOverlay.HoverCode("Table1");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("object");
      _.peekOverlay.ResetHover();

      // widget property
      _.peekOverlay.HoverCode("Table1.pageNo");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("number");
      _.peekOverlay.CheckPrimitiveValue("1");
      _.peekOverlay.ResetHover();

      // widget property
      _.peekOverlay.HoverCode("Table1.tableData");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("array");
      _.peekOverlay.CheckObjectArrayInOverlay([{}, {}, {}]);
      _.peekOverlay.ResetHover();
    });
  });
});
