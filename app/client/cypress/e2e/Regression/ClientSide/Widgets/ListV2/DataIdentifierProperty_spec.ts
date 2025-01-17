import {
  agHelper,
  debuggerHelper,
  draggableWidgets,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "List v2 - Data Identifier property",
  { tags: ["@tag.All", "@tag.List", "@tag.Binding"] },
  () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    it("1. is present in the property pane", () => {
      agHelper.AddDsl("Listv2/simpleList");

      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.AssertPropertiesDropDownCurrentValue(
        "Data Identifier",
        "Please select an option",
      );

      //shows list of keys present in list data"

      const keys = ["id", "name", "img"];
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.AssertPropertiesDropDownValues("Data Identifier", keys);
    });

    it("2. on selection of key from dropdown, it should show same number of rows", () => {
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      // clicking on the data identifier dropdown and select key id
      propPane.SelectPropertiesDropDown("Data Identifier", "id");
      agHelper.AssertElementLength(
        locators._widgetInCanvas(draggableWidgets.CONTAINER),
        3,
      );
    });

    it("3. enabling the JS mode, it should prefill with currentItem", () => {
      propPane.ToggleJSMode("Data Identifier", true);
      propPane.ValidatePropertyFieldValue(
        "Data Identifier",
        `{{ currentItem["id"] }}`,
      );
    });

    it("4. when given composite key, should produce a valid array", () => {
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

    it("5. with large data set and data identifier set, the rows should render", () => {
      agHelper.AddDsl("Listv2/simpleListWithLargeData");
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      // clicking on the data identifier dropdown
      propPane.SelectPropertiesDropDown("Data Identifier", "id", "Action", 0);
      agHelper.AssertElementLength(
        locators._widgetInCanvas(draggableWidgets.CONTAINER),
        2,
      );
      //pagination should work
      table.NavigateToSpecificPage_List(2);
      agHelper.AssertElementLength(
        locators._widgetInCanvas(draggableWidgets.CONTAINER),
        2,
      );
    });

    it("6. non unique data identifier should throw error", () => {
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
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
  },
);
