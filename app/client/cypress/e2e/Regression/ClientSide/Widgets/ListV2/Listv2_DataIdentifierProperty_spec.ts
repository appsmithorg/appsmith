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
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. is present in the property pane", () => {
    agHelper.AddDsl("Listv2/simpleList");

    entityExplorer.SelectEntityByName("List1");

    agHelper.GetNAssertContains(
      `${locators._propertyControl}dataidentifier`,
      "Please select an option",
    );
  });

  it("2. shows list of keys present in list data", () => {
    const keys = ["id", "name", "img"];
    entityExplorer.SelectEntityByName("List1");
    // clicking on the data identifier dropdown
    agHelper
      .GetElement(locators._existingFieldTextByName("Data Identifier"))
      .find(locators._selectSearch)
      .last()
      .click({ force: true });
    // check if all the keys are present
    agHelper
      .AssertElementLength(`${propPane._optionContent}> div > span`, 3)
      .then(($el) => {
        // we get a list of jQuery elements
        // convert the jQuery object into a plain array
        return (
          Cypress.$.makeArray($el)
            // extract inner text from each
            .map((el: any) => el.innerText)
        );
      })
      .should("deep.equal", keys);
  });

  it("3. on selection of key from dropdown, it should show same number of rows", () => {
    entityExplorer.SelectEntityByName("List1");
    // clicking on the data identifier dropdown and select key id
    propPane.SelectPropertiesDropDown("Data Identifier", "id");
    agHelper.AssertElementLength(
      locators._widgetInCanvas(draggableWidgets.CONTAINER),
      3,
    );
  });

  it("4. enabling the JS mode, it should prefill with currentItem", () => {
    propPane.ToggleJSMode("Data Identifier", true);
    agHelper
      .GetElement(locators._existingFieldTextByName("Data Identifier"))
      .find(".CodeMirror .CodeMirror-code")
      .contains(`{{ currentItem["id"] }}`);
  });

  it("5. when given composite key, should produce a valid array", () => {
    const keys = ["001_Blue_0_ABC", "002_Green_1_ABC", "003_Red_2_ABC"];
    propPane.ToggleJSMode("Data Identifier", false);
    propPane.UpdatePropertyFieldValue(
      "Data Identifier",
      "{{currentItem.id + '_' + currentItem.name + '_' + currentIndex }}_ABC",
    );
    agHelper.Sleep(1000);
    keys.forEach((key) => {
      agHelper.GetNAssertContains(locators._evaluatedValue, key);
    });
  });

  it("6. with large data set and data identifier set, the rows should render", () => {
    agHelper.AddDsl("Listv2/simpleListWithLargeData");
    entityExplorer.SelectEntityByName("List1");
    // clicking on the data identifier dropdown
    propPane.SelectPropertiesDropDown("Data Identifier", "id", "Action", 0);
    agHelper.AssertElementLength(
      locators._widgetInCanvas(draggableWidgets.CONTAINER),
      2,
    );
    agHelper.GetNClickByContains(`${locators._pagination} a`, "2", 0, true);
    agHelper.AssertElementLength(
      locators._widgetInCanvas(draggableWidgets.CONTAINER),
      2,
    );
  });

  it("7. non unique data identifier should throw error", () => {
    entityExplorer.SelectEntityByName("List1");
    // clicking on the data identifier dropdown
    propPane.SelectPropertiesDropDown("Data Identifier", "name", "Action", 0);
    agHelper.AssertElementLength(
      locators._widgetInCanvas(draggableWidgets.CONTAINER),
      2,
    );
    // click on debugger icon
    agHelper.GetNClick(debuggerHelper.locators._debuggerIcon, 0, true);
    agHelper.GetNAssertContains(
      debuggerHelper.locators._debuggerList,
      "This data identifier is evaluating to a duplicate value. Please use an identifier that evaluates to a unique value.",
    );
  });

  it("8. pagination should work for non unique data identifier", () => {
    agHelper.GetNClickByContains(`${locators._pagination} a`, "2", 0, true);
    agHelper.AssertElementLength(
      locators._widgetInCanvas(draggableWidgets.CONTAINER),
      2,
    );
  });

  it("9. Widgets get displayed when PrimaryKey doesn't exist - SSP", () => {
    agHelper.AddDsl("Listv2/ListV2WithNullPrimaryKey");
    apiPage.CreateAndFillApi(
      "https://api.punkapi.com/v2/beers?page={{List1.pageNo}}&per_page={{List1.pageSize}}",
      "",
    );
    apiPage.RunAPI(false);
    entityExplorer.ExpandCollapseEntity("List1");
    entityExplorer.ExpandCollapseEntity("Container1");
    entityExplorer.SelectEntityByName("Text2");
    propPane.UpdatePropertyFieldValue("Text", "{{currentIndex}}");
    agHelper.AssertText(
      `${locators._widgetByName("Text2")} ${locators._bodyTextStyle}`,
      "text",
      "0",
      0,
    );

    // agHelper.GetNClick(locators._nextPage, 0, true);
    agHelper.GetNClick("//button[@area-label='next page']", 0, true);
    agHelper.Sleep(3000);
    agHelper
      .GetText(locators._listActivePage, "text", 0)
      .then(($newPageNo) => expect(Number($newPageNo)).to.eq(2));
    // table.NavigateToNextPage_List("v2");
    agHelper.Sleep(1000);

    agHelper.AssertText(
      `${locators._widgetByName("Text2")} ${locators._bodyTextStyle}`,
      "text",
      "0",
      0,
    );
  });

  it("10. Widgets get displayed when PrimaryKey doesn't exist - Client-Side Pagination", () => {
    entityExplorer.ExpandCollapseEntity("List2");
    entityExplorer.ExpandCollapseEntity("Container2");
    entityExplorer.SelectEntityByName("Text4");
    propPane.UpdatePropertyFieldValue("Text", "{{currentIndex}}");

    agHelper.AssertText(
      `${locators._widgetByName("Text4")} ${locators._bodyTextStyle}`,
      "text",
      "0",
      0,
    );

    //agHelper.GetNClick(locators._nextPage, 1, true);
    table.NavigateToNextPage_List("v2", 1);
    agHelper.AssertText(
      `${locators._widgetByName("Text4")} ${locators._bodyTextStyle}`,
      "text",
      "1",
      0,
    );

    //agHelper.GetNClick(locators._nextPage, 1, true);
    table.NavigateToNextPage_List("v2", 1);

    agHelper.AssertText(
      `${locators._widgetByName("Text4")} ${locators._bodyTextStyle}`,
      "text",
      "2",
      0,
    );
  });

  it("11. Non unique data identifier should throw error- (data type issue)", () => {
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
