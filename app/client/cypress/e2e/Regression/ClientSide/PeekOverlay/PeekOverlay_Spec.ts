import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Peek overlay", () => {
  it("1. Main test", () => {
    cy.fixture("datasources").then((datasourceFormData: any) => {
      _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 500, 100);
      _.entityExplorer.NavigateToSwitcher("Explorer");
      _.table.AddSampleTableData();
      _.apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"]);
      _.apiPage.RunAPI();
      _.apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"]);
      _.jsEditor.CreateJSObject(JsObjectContent, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        lineNumber: 0,
        prettify: true,
      });
      _.jsEditor.SelectFunctionDropdown("myFun2");
      _.jsEditor.RunJSObj();
      _.agHelper.Sleep();
      _.debuggerHelper.CloseBottomBar();

      // check number array
      _.peekOverlay.HoverCode(8, 3, "numArray");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("array");
      _.peekOverlay.CheckPrimitveArrayInOverlay([1, 2, 3]);
      _.peekOverlay.ResetHover();

      // check basic object
      _.peekOverlay.HoverCode(9, 3, "objectData");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("object");
      _.peekOverlay.CheckBasicObjectInOverlay({ x: 123, y: "123" });
      _.peekOverlay.ResetHover();

      // check null - with this keyword
      _.peekOverlay.HoverCode(10, 3, "nullData");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("null");
      _.peekOverlay.CheckPrimitiveValue("null");
      _.peekOverlay.ResetHover();

      // check number
      _.peekOverlay.HoverCode(11, 3, "numberData");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("number");
      _.peekOverlay.CheckPrimitiveValue("1");
      _.peekOverlay.ResetHover();

      // check boolean
      _.peekOverlay.HoverCode(12, 3, "isLoading");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("boolean");
      _.peekOverlay.CheckPrimitiveValue("false");
      _.peekOverlay.ResetHover();

      // TODO: handle this function failure on CI tests -> "function(){}"
      // check function
      // _.peekOverlay.HoverCode(13, 3, "run");
      // _.peekOverlay.IsOverlayOpen();
      // _.peekOverlay.VerifyDataType("function");
      // _.peekOverlay.CheckPrimitiveValue("function () {}");
      // _.peekOverlay.ResetHover();

      // check undefined
      _.peekOverlay.HoverCode(14, 3, "data");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("undefined");
      _.peekOverlay.CheckPrimitiveValue("undefined");
      _.peekOverlay.ResetHover();

      // check string
      _.peekOverlay.HoverCode(15, 3, "mode");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("string");
      _.peekOverlay.CheckPrimitiveValue("EDIT");
      _.peekOverlay.ResetHover();

      // check if overlay closes
      _.peekOverlay.HoverCode(16, 3, "store");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.ResetHover();
      _.peekOverlay.IsOverlayOpen(false);

      // widget object
      _.peekOverlay.HoverCode(17, 1, "Table1");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("object");
      _.peekOverlay.ResetHover();

      // widget property
      _.peekOverlay.HoverCode(18, 3, "pageNo");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("number");
      _.peekOverlay.CheckPrimitiveValue("1");
      _.peekOverlay.ResetHover();

      // widget property
      _.peekOverlay.HoverCode(19, 3, "tableData");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("array");
      _.peekOverlay.CheckObjectArrayInOverlay([{}, {}, {}]);
      _.peekOverlay.ResetHover();

      // basic nested property
      _.peekOverlay.HoverCode(20, 7, "id");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("number");
      _.peekOverlay.CheckPrimitiveValue("1");
      _.peekOverlay.ResetHover();

      // undefined object
      _.peekOverlay.HoverCode(21, 1, "aljshdlja");
      _.peekOverlay.IsOverlayOpen(false);
      _.peekOverlay.ResetHover();

      // this keyword
      _.peekOverlay.HoverCode(22, 3, "numArray");
      _.peekOverlay.IsOverlayOpen();
      _.peekOverlay.VerifyDataType("array");
      _.peekOverlay.CheckPrimitveArrayInOverlay([1, 2, 3]);
      _.peekOverlay.ResetHover();

      // pageList is an internal property - peek overlay shouldn't work
      _.peekOverlay.HoverCode(23, 1, "pageList");
      _.peekOverlay.IsOverlayOpen(false);
      _.peekOverlay.ResetHover();
    });
  });
});

const JsObjectContent = `export default {
  numArray: [1, 2, 3],
  objectArray: [ {x: 123}, { y: "123"} ],
  objectData: { x: 123, y: "123" },
  nullData: null,
  numberData: 1,
  myFun1: () => {
    // TODO: handle this keyword failure on CI tests
    JSObject1.numArray;
    JSObject1.objectData; 
    JSObject1.nullData; 
    JSObject1.numberData;
    Api1.isLoading; 
    Api1.run(); 
    Api2.data;
    appsmith.mode; 
    appsmith.store.abc;
    Table1;
    Table1.pageNo; 
    Table1.tableData;
    Api1.data[0].id;
    aljshdlja;
    this.numArray;
    pageList;
  },
  myFun2: async () => {
    storeValue("abc", 123)
    return Api1.run()
  }
}`;
