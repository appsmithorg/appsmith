import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe("", { tags: ["@tag.Widget", "@tag.Chart", "@tag.Visual"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.CHART);
  });

  afterEach(() => {
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
  });

  it("1. Test pie chart", () => {
    propPane.SelectPropertiesDropDown("Chart Type", "Pie chart");
    agHelper.AssertAutoSave();
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.TogglePropertyState("Show Labels", "On");
    deployMode.DeployApp();
  });

  it("2. Test line chart", () => {
    propPane.TogglePropertyState("Show Labels", "Off");
    propPane.SelectPropertiesDropDown("Chart Type", "Line chart");
    agHelper.AssertAutoSave();
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.TogglePropertyState("Show Labels", "On");
    deployMode.DeployApp();
  });

  it("3. Test column chart", () => {
    propPane.TogglePropertyState("Show Labels", "Off");
    propPane.SelectPropertiesDropDown("Chart Type", "Column chart");
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.TogglePropertyState("Show Labels", "On");
    deployMode.DeployApp();
  });

  it("4. Test area chart", () => {
    propPane.TogglePropertyState("Show Labels", "Off");
    propPane.SelectPropertiesDropDown("Chart Type", "Area chart");
    agHelper.AssertAutoSave();
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.TogglePropertyState("Show Labels", "On");
    deployMode.DeployApp();
  });
});
