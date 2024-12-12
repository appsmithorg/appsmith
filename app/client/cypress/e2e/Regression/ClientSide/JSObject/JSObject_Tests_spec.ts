import HomePage from "../../../../locators/HomePage";
import {
  agHelper,
  entityExplorer,
  jsEditor,
  propPane,
  draggableWidgets,
  locators,
} from "../../../../support/ee/ObjectsCore_EE";
import EditorNavigation, {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe("Validate JSObj", {}, () => {
  before(() => {});

  it("1. Verify adding JSObject and more actions options", () => {
    jsEditor.CreateJSObject(
      `setInterval(() => {
        showAlert("Hi", "error")
    }, 2500, "Int")`,
      {
        paste: true,
        completeReplace: false,
        toRun: true,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.EnableDisableAsyncFuncSettings("myFun1");

    // Add new JSObject
    PageList.AddNewPage("New blank page");
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    agHelper.GetNClick(locators._createNew);
    agHelper.GetNClick(jsEditor._addJSObj);
    agHelper.AssertContains("JSObject2", "exist", ".t--entity-name");
    agHelper.GetNClick(EditorNavigation.locators.MinimizeBtn);
    agHelper.GetNClick(jsEditor._addJSObj);
    agHelper.GetNClick(EditorNavigation.locators.MaximizeBtn);
    agHelper.AssertContains("JSObject3", "exist", ".t--entity-name");

    // Verify menu item
    agHelper.GetNClick(jsEditor._jsPageActions, 0, true);
    agHelper.AssertContains("Rename", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Show bindings", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Copy to page", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Move to page", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Delete", "exist", HomePage.portalMenuItem);

    agHelper.GetNClick(jsEditor._moreActions, 0, true);
    agHelper.AssertContains("Rename", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Copy to page", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Move to page", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Prettify code", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Delete", "exist", HomePage.portalMenuItem);
  });

  it("2. Verify alert message on page load", () => {
    // Verify alert message on page load
    EditorNavigation.NavigateToPage("Page1", true);
    agHelper.ValidateToastMessage("Hi");
  });

  it("3. Verify moving JSObject to new page", () => {
    // Verify Move to Page
    agHelper.GetNClick(jsEditor._jsPageActions, 0, true);
    agHelper.HoverElement(
      `${HomePage.portalMenuItem}:contains("Move to page")`,
    );
    agHelper.GetNClick(`${HomePage.portalMenuItem}:contains("Page2")`);

    // Verify 'Run on page load' on new page
    agHelper.GetNClick(`.t--entity-name:contains("JSObject11")`);
    jsEditor.VerifyAsyncFuncSettings("myFun1");
  });

  it("4. Verify JSObject binding", () => {
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 500, 100);
    propPane.EnterJSContext("onClick", "{{JSObject11.myFun1();}}", true, false);
    agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
    agHelper.ValidateToastMessage("Hi");
  });
});
