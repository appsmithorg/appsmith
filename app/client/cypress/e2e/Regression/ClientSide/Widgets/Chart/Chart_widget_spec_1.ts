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
    // TODO: Figure out why local screenshots differ in CI
    // agHelper
    //   .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
    //   .matchImageSnapshot("chartwidget/piechartsnapshot");
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.TogglePropertyState("Show Labels", "On");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/piechartsnapshotwithlabels");
  });

  it("2. Test line chart", () => {
    propPane.TogglePropertyState("Show Labels", "Off");
    propPane.SelectPropertiesDropDown("Chart Type", "Line chart");
    agHelper.AssertAutoSave();
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/linechartsnapshot");
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.TogglePropertyState("Show Labels", "On");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/linechartsnapshotwithlabels");
  });

  it("3. Test column chart", () => {
    propPane.TogglePropertyState("Show Labels", "Off");
    propPane.SelectPropertiesDropDown("Chart Type", "Column chart");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/columnchartsnapshot");
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.TogglePropertyState("Show Labels", "On");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/columnchartsnapshotwithlabels");
  });

  it("4. Test area chart", () => {
    propPane.TogglePropertyState("Show Labels", "Off");
    propPane.SelectPropertiesDropDown("Chart Type", "Area chart");
    agHelper.AssertAutoSave();
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/areachartsnapshot");
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.TogglePropertyState("Show Labels", "On");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/areachartsnapshotwithlabels");
  });
});
