import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  draggableWidgets,
  debuggerHelper,
  apiPage,
  table,
} from "../../../../../support/Objects/ObjectsCore";

const data = [
  {
    id: "001",
    name: "Blue",
    img: "https://assets.appsmith.com/widgets/default.png",
    same: "1",
  },
  {
    id: "002",
    name: "Green",
    img: "https://assets.appsmith.com/widgets/default.png",
    same: "01",
  },
  {
    id: "003",
    name: "Red",
    img: "https://assets.appsmith.com/widgets/default.png",
    same: 1,
  },
];

describe("List v2 - Data Identifier property", () => {
  before(() => {
    agHelper.AddDsl("Listv2/ListV2WithNullPrimaryKey");
    agHelper.Sleep(3000); //for List to load for CI flakyness
  });

  it("1. Widgets get displayed when PrimaryKey doesn't exist - SSP", () => {
    apiPage.CreateAndFillApi(
      "https://api.punkapi.com/v2/beers?page={{List1.pageNo}}&per_page={{List1.pageSize}}",
      "",
    );
    agHelper.VerifyEvaluatedValue(
      "https://api.punkapi.com/v2/beers?page=1&per_page=2",
    );
    apiPage.RunAPI(false);
    entityExplorer.ExpandCollapseEntity("List1");
    entityExplorer.SelectEntityByName("Text2", "Container1");
    propPane.UpdatePropertyFieldValue("Text", "{{currentIndex}}");
    agHelper.AssertText(propPane._widgetToVerifyText("Text2"), "text", "0");
    table.NavigateToPageUsingButton_List("next", 2);
    agHelper.AssertText(propPane._widgetToVerifyText("Text2"), "text", "0");
  });

  it("2. Widgets get displayed when PrimaryKey doesn't exist - Client-Side Pagination", () => {
    entityExplorer.ExpandCollapseEntity("List2");
    entityExplorer.SelectEntityByName("Text4", "Container2");
    propPane.UpdatePropertyFieldValue("Text", "{{currentIndex}}");
    agHelper.AssertText(propPane._widgetToVerifyText("Text4"), "text", "0");

    table.NavigateToNextPage_List("v2", 1);
    agHelper.AssertText(propPane._widgetToVerifyText("Text4"), "text", "1");

    table.NavigateToNextPage_List("v2", 1);
    agHelper.AssertText(propPane._widgetToVerifyText("Text4"), "text", "2");
  });

  it("3. Non unique data identifier should throw error- (data type issue)", () => {
    entityExplorer.SelectEntityByName("List2");
    propPane.UpdatePropertyFieldValue("Items", JSON.stringify(data));
    // clicking on the data identifier dropdown
    propPane.RemoveText("dataidentifier");
    propPane.ToggleJSMode("Data Identifier", false);
    // clicking on the data identifier dropdown and select key same
    propPane.SelectPropertiesDropDown("Data Identifier", "same");
    agHelper.AssertElementLength(
      `${locators._widgetByName("List2")} ${locators._widgetInCanvas(
        draggableWidgets.CONTAINER,
      )}`,
      1,
    );
    //Open debugger by clicking debugger icon in canvas.
    debuggerHelper.ClickDebuggerIcon();
    agHelper.GetNAssertContains(
      debuggerHelper.locators._debuggerList,
      "This data identifier is evaluating to a duplicate value. Please use an identifier that evaluates to a unique value.",
    );
  });
});
