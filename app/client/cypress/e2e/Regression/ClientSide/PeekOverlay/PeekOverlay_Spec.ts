import {
  agHelper,
  entityExplorer,
  jsEditor,
  apiPage,
  table,
  debuggerHelper,
  peekOverlay,
  dataManager,
} from "../../../../support/Objects/ObjectsCore";

describe("Peek overlay", { tags: ["@tag.JS", "@tag.Binding"] }, () => {
  it("1. Main test", () => {
    entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 500, 100);
    table.AddSampleTableData();
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );
    agHelper.Sleep(2000);
    apiPage.RunAPI();
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );
    agHelper.Sleep(2000);

    jsEditor.CreateJSObject(JsObjectContent, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      lineNumber: 0,
      prettify: true,
    });
    jsEditor.SelectFunctionDropdown("myFun2");
    jsEditor.RunJSObj();
    agHelper.Sleep();
    debuggerHelper.CloseBottomBar();

    // check number array
    peekOverlay.HoverCode(8, 3, "numArray");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("array");
    peekOverlay.CheckPrimitveArrayInOverlay([1, 2, 3]);
    peekOverlay.ResetHover();

    // check basic object
    peekOverlay.HoverCode(9, 3, "objectData");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("object");
    peekOverlay.CheckBasicObjectInOverlay({ x: 123, y: "123" });
    peekOverlay.ResetHover();

    // check null - with this keyword
    peekOverlay.HoverCode(10, 3, "nullData");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("null");
    peekOverlay.CheckPrimitiveValue("null");
    peekOverlay.ResetHover();

    // check number
    peekOverlay.HoverCode(11, 3, "numberData");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("number");
    peekOverlay.CheckPrimitiveValue("1");
    peekOverlay.ResetHover();

    // check boolean
    peekOverlay.HoverCode(12, 3, "isLoading");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("boolean");
    peekOverlay.CheckPrimitiveValue("false");
    peekOverlay.ResetHover();

    // TODO: handle this function failure on CI tests -> "function(){}"
    // check function
    // peekOverlay.HoverCode(13, 3, "run");
    // peekOverlay.IsOverlayOpen();
    // peekOverlay.VerifyDataType("function");
    // peekOverlay.CheckPrimitiveValue("function () {}");
    // peekOverlay.ResetHover();

    // check undefined
    peekOverlay.HoverCode(14, 3, "data");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("undefined");
    peekOverlay.CheckPrimitiveValue("undefined");
    peekOverlay.ResetHover();

    // check string
    peekOverlay.HoverCode(15, 3, "mode");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("string");
    peekOverlay.CheckPrimitiveValue("EDIT");
    peekOverlay.ResetHover();

    // check if overlay closes
    peekOverlay.HoverCode(16, 3, "store");
    peekOverlay.IsOverlayOpen();
    peekOverlay.ResetHover();
    peekOverlay.IsOverlayOpen(false);

    // widget object
    peekOverlay.HoverCode(17, 1, "Table1");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("object");
    peekOverlay.ResetHover();

    // widget property
    peekOverlay.HoverCode(18, 3, "pageNo");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("number");
    peekOverlay.CheckPrimitiveValue("1");
    peekOverlay.ResetHover();

    // widget property
    peekOverlay.HoverCode(19, 3, "tableData");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("array");
    peekOverlay.CheckObjectArrayInOverlay([{}, {}, {}]);
    peekOverlay.ResetHover();

    // basic nested property
    peekOverlay.HoverCode(20, 7, "id");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("number");
    peekOverlay.CheckPrimitiveValue("1");
    peekOverlay.ResetHover();

    // undefined object
    peekOverlay.HoverCode(21, 1, "aljshdlja");
    peekOverlay.IsOverlayOpen(false);
    peekOverlay.ResetHover();

    // this keyword
    peekOverlay.HoverCode(22, 3, "numArray");
    peekOverlay.IsOverlayOpen();
    peekOverlay.VerifyDataType("array");
    peekOverlay.CheckPrimitveArrayInOverlay([1, 2, 3]);
    peekOverlay.ResetHover();

    // pageList is an internal property - peek overlay shouldn't work
    peekOverlay.HoverCode(23, 1, "pageList");
    peekOverlay.IsOverlayOpen(false);
    peekOverlay.ResetHover();
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
