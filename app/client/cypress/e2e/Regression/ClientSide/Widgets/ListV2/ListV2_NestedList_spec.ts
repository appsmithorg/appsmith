import { WIDGET } from "../../../../../locators/WidgetLocators";
import {
  agHelper,
  deployMode,
  propPane,
  appSettings,
  locators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Nested List widget V2 ",
  { tags: ["@tag.All", "@tag.List", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("listV2NestedDsl");
    });

    it("1. Verify only 3 levels of nesting is allowed", () => {
      agHelper.AssertContains(
        "Oops, Something went wrong.",
        "not.exist",
        locators._widgetInCanvas(WIDGET.LIST_V2),
      );
      agHelper
        .GetElement(locators._widgetInCanvas(WIDGET.LIST_V2))
        .should("have.length", 5);
      EditorNavigation.SelectEntityByName("List3", EntityType.Widget, {}, [
        "List1",
        "Container1",
        "List2",
        "Container2",
      ]);
      agHelper.GetElement("body").type(`{${agHelper._modifierKey}}{c}`);
      agHelper.Sleep(1000);
      agHelper.WaitUntilAllToastsDisappear();
      EditorNavigation.SelectEntityByName("Container3", EntityType.Widget, {}, [
        "List3",
      ]);
      agHelper.GetElement("body").type(`{${agHelper._modifierKey}}{v}`);
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.ClickLogsTab();
      _.debuggerHelper.DoesConsoleLogExist(
        "Cannot have more than 3 levels of nesting in the list widget",
        true,
      );
    });

    it("2. Verify nested List has same property as parent", () => {
      const dataProperties = ["items", "dataidentifier"];

      const paginationProperties = ["serversidepagination"];

      const itemSelectionProperties = ["defaultselecteditem", "onitemclick"];

      const generalProperties = ["visible", "animateloading"];

      // Parent List
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.AssertPropertyVisibility(dataProperties, "data");
      propPane.AssertPropertyVisibility(paginationProperties, "pagination");
      propPane.AssertPropertyVisibility(
        itemSelectionProperties,
        "itemselection",
      );
      propPane.AssertPropertyVisibility(generalProperties, "general");

      // First Child, List2
      EditorNavigation.SelectEntityByName("List2", EntityType.Widget);
      propPane.AssertPropertyVisibility(dataProperties, "data");
      propPane.AssertPropertyVisibility(paginationProperties, "pagination");
      propPane.AssertPropertyVisibility(
        itemSelectionProperties,
        "itemselection",
      );
      propPane.AssertPropertyVisibility(generalProperties, "general");

      // Second Child, List3
      EditorNavigation.SelectEntityByName("List3", EntityType.Widget);
      propPane.AssertPropertyVisibility(dataProperties, "data");
      propPane.AssertPropertyVisibility(paginationProperties, "pagination");
      propPane.AssertPropertyVisibility(
        itemSelectionProperties,
        "itemselection",
      );
      propPane.AssertPropertyVisibility(generalProperties, "general");
    });

    it("3. Verify auto suggestions and {{currentView}} displays all widgets added in that List ", () => {
      // Verify level_1 and level_2 are available
      EditorNavigation.SelectEntityByName("Text5", EntityType.Widget, {}, [
        "Container3",
      ]);
      propPane.TypeTextIntoField("Text", "{{level");
      agHelper.Sleep(500);
      agHelper.GetNAssertElementText(
        locators._hintsList,
        "level_1",
        "contain.text",
      );
      agHelper.GetNAssertElementText(
        locators._hintsList,
        "level_2",
        "contain.text",
      );

      propPane.TypeTextIntoField("Text", "{{level1.currentView.");
      agHelper.Sleep(500);
      agHelper.GetNAssertElementText(
        locators._hintsList,
        "Image1",
        "contain.text",
      );
      agHelper.GetNAssertElementText(
        locators._hintsList,
        "Text1",
        "contain.text",
      );
      agHelper.GetNAssertElementText(
        locators._hintsList,
        "Text2",
        "contain.text",
      );
      agHelper.GetNAssertElementText(
        locators._hintsList,
        "List2",
        "contain.text",
      );

      propPane.UpdatePropertyFieldValue(
        "Text",
        "{{level_1.currentView.Text1.text}}",
      );
      agHelper.AssertText(
        `${locators._widgetInDeployed("text5")} .bp3-ui-text`,
        "text",
        "Blue",
      );
    });

    it("4. Verify making child widget invisble should not break the app", () => {
      EditorNavigation.SelectEntityByName("List3", EntityType.Widget, {}, [
        "List1",
        "Container1",
        "List2",
        "Container2",
      ]);

      propPane.TogglePropertyState("visible", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(locators._widgetInDeployed("list3"));
      deployMode.NavigateBacktoEditor();
    });

    it("5. Verify Theme change", () => {
      agHelper.PressEscape();
      appSettings.OpenPaneAndChangeTheme("Pacific");
      agHelper.WaitUntilToastDisappear("Theme Pacific applied");
      [0, 1, 2].forEach((index) => {
        agHelper.AssertAttribute(
          locators._listText,
          "font-family",
          "Open Sans",
          index,
        );
      });
    });
  },
);
