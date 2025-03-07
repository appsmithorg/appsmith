import * as _ from "../../../../support/Objects/ObjectsCore";
import OneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Widget property navigation",
  { tags: ["@tag.Widget", "@tag.excludeForAirgap", "@tag.Binding"] },
  () => {
    it("1. Collapsed field navigation", () => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.AUDIO);
      _.propPane.EnterJSContext("animateloading", "{{test}}", true, false);
      _.debuggerHelper.AssertErrorCount(1);
      _.propPane.ToggleSection("general");
      _.agHelper.AssertElementAbsence("animateloading");
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.ClicklogEntityLink();
      _.propPane.AssertIfPropertyIsVisible("animateloading");

      _.propPane.DeleteWidgetFromPropertyPane("Audio1");
      _.debuggerHelper.CloseBottomBar();
    });

    it("2. Navigation to a nested panel", () => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TAB);
      _.propPane.OpenTableColumnSettings("tab2");
      _.propPane.EnterJSContext("visible", "{{test}}", true, false);
      _.debuggerHelper.AssertErrorCount(1);
      _.propPane.NavigateBackToPropertyPane();
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.ClicklogEntityLink();
      _.agHelper.GetNAssertContains(_.propPane._paneTitle, "Tab 2");
      _.propPane.AssertIfPropertyIsVisible("visible");
      _.debuggerHelper.CloseBottomBar();
      EditorNavigation.SelectEntityByName("Tabs1", EntityType.Widget);
      _.entityExplorer.DeleteWidgetFromEntityExplorer("Tabs1");
    });

    it("3. Navigation to style tab in a nested panel", () => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON_GROUP);
      _.propPane.OpenTableColumnSettings("groupButton2");
      _.agHelper.GetNClick(_.propPane._segmentedControl("MENU"));
      _.agHelper.GetNClick(_.propPane._addMenuItem);
      _.agHelper.GetNClick(_.propPane._tableEditColumnButton);
      _.propPane.MoveToTab("Style");
      _.propPane.EnterJSContext("icon", "{{test}}", true, false);
      _.debuggerHelper.AssertErrorCount(1);
      _.propPane.NavigateBackToPropertyPane(false);
      _.propPane.NavigateBackToPropertyPane();
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.ClicklogEntityLink();
      _.agHelper.GetNAssertContains(_.propPane._paneTitle, "Menu Item");
      _.propPane.AssertIfPropertyIsVisible("icon");
      _.debuggerHelper.CloseBottomBar();
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      _.entityExplorer.DeleteWidgetFromEntityExplorer("ButtonGroup1");
    });

    it("4. Collapsed field navigation for a nested panel", () => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.MENUBUTTON);
      _.propPane.OpenTableColumnSettings("menuItem2");
      _.propPane.EnterJSContext("disabled", "{{test}}", true, false);
      _.propPane.ToggleSection("general");
      _.propPane.MoveToTab("Style");
      _.debuggerHelper.AssertErrorCount(1);
      _.propPane.NavigateBackToPropertyPane();
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.ClicklogEntityLink();
      _.agHelper.GetNAssertContains(_.propPane._paneTitle, "Second Menu Item");
      _.propPane.AssertIfPropertyIsVisible("disabled");
      _.debuggerHelper.CloseBottomBar();
      EditorNavigation.SelectEntityByName("MenuButton1", EntityType.Widget);
      _.entityExplorer.DeleteWidgetFromEntityExplorer("MenuButton1");
    });

    it("5. JSONForm widget error navigation", () => {
      const schema = {
        name: "John",
        date_of_birth: "20/02/1990",
        employee_id: 1001,
      };
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.JSONFORM);
      _.propPane.EnterJSContext(
        "sourcedata",
        JSON.stringify(schema) + " ",
        true,
        false,
      );
      _.propPane.OpenTableColumnSettings("date_of_birth");

      _.propPane.SelectPropertiesDropDown("Field Type", "Object");
      _.agHelper.GetNClick(_.propPane._addColumnItem);
      _.agHelper.GetNClick(_.propPane._addColumnItem);
      _.propPane.OpenTableColumnSettings("customField1");

      _.propPane.SelectPropertiesDropDown("Field Type", "Object");
      _.agHelper.GetNClick(_.propPane._addColumnItem);
      _.agHelper.GetNClick(_.propPane._addColumnItem);
      _.propPane.OpenTableColumnSettings("customField2");

      _.propPane.MoveToTab("Style");

      _.propPane.EnterJSContext("borderradius", "{{test}}", true, false);
      _.debuggerHelper.AssertErrorCount(1);
      _.propPane.ToggleSection("borderandshadow");
      _.propPane.MoveToTab("Content");

      _.propPane.NavigateBackToPropertyPane(false);
      _.propPane.NavigateBackToPropertyPane(false);
      _.propPane.NavigateBackToPropertyPane();

      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.ClicklogEntityLink();
      _.agHelper.GetNAssertContains(_.propPane._paneTitle, "Custom Field 2");
      _.propPane.AssertIfPropertyIsVisible("borderradius");

      _.debuggerHelper.CloseBottomBar();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      _.entityExplorer.DeleteWidgetFromEntityExplorer("JSONForm1");
    });

    it("6. Should switch panels correctly", () => {
      _.agHelper.RefreshPage();
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.MENUBUTTON);
      _.propPane.OpenTableColumnSettings("menuItem1");

      _.propPane.EnterJSContext("disabled", "{{test}}", true, false);
      _.debuggerHelper.AssertErrorCount(1);
      _.propPane.NavigateBackToPropertyPane();

      _.propPane.OpenTableColumnSettings("menuItem2");
      _.propPane.EnterJSContext("disabled", "{{test}}", true, false);
      _.debuggerHelper.AssertErrorCount(2);

      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.ClicklogEntityLink(true);
      _.agHelper.GetNAssertContains(_.propPane._paneTitle, "First Menu Item");
      _.debuggerHelper.CloseBottomBar();
      EditorNavigation.SelectEntityByName("MenuButton1", EntityType.Widget);
      _.entityExplorer.DeleteWidgetFromEntityExplorer("MenuButton1");
    });

    it.skip("7. Table widget validation regex", () => {
      _.agHelper.RefreshPage();
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE);
      _.agHelper.GetNClick(OneClickBindingLocator.datasourceDropdownSelector);
      _.agHelper.GetNClick(
        OneClickBindingLocator.datasourceSelector("sample Movies"),
      );
      _.assertHelper.AssertNetworkStatus("@getDatasourceStructure");
      _.agHelper.AssertElementExist(OneClickBindingLocator.connectData);
      _.agHelper.AssertContains("Select collection");
      _.agHelper.AssertElementEnabledDisabled(
        OneClickBindingLocator.connectData,
      );
      _.agHelper.GetNClick(OneClickBindingLocator.tableOrSpreadsheetDropdown);
      _.agHelper.GetNClick(
        OneClickBindingLocator.tableOrSpreadsheetDropdownOption("movies"),
      );
      _.agHelper.GetNClick(OneClickBindingLocator.searchableColumn);
      _.agHelper.GetNClick(
        OneClickBindingLocator.columnDropdownOption(
          "searchableColumn",
          "imdb_id",
        ),
      );
      _.agHelper.GetNClick(OneClickBindingLocator.connectData);
      _.table.WaitUntilTableLoad(0, 0, "v2");
      _.propPane.OpenTableColumnSettings("imdb_id");
      _.propPane.TypeTextIntoField("Regex", "{{test}}");
      _.debuggerHelper.AssertErrorCount(1);
      _.propPane.ToggleSection("validation");
      _.propPane.NavigateBackToPropertyPane();

      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.ClicklogEntityLink();
      _.agHelper.GetNAssertContains(_.propPane._paneTitle, "imdb_id");
      _.debuggerHelper.CloseBottomBar();
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.entityExplorer.DeleteWidgetFromEntityExplorer("Table1");
    });
  },
);
