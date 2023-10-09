import {
  agHelper,
  entityExplorer,
  deployMode,
  draggableWidgets,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe("", () => {
  before(() => {
    entityExplorer.DragNDropWidget(draggableWidgets.CHART);
  });

  afterEach(() => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Chart1");
  });

  it("1. Test pie chart", () => {
    propPane.SelectPropertiesDropDown("Chart Type", "Pie chart");
    agHelper.AssertAutoSave();
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/piechartsnapshot");
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Chart1");
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
    entityExplorer.SelectEntityByName("Chart1");
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
    entityExplorer.SelectEntityByName("Chart1");
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
    entityExplorer.SelectEntityByName("Chart1");
    propPane.TogglePropertyState("Show Labels", "On");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/areachartsnapshotwithlabels");
  });
});
