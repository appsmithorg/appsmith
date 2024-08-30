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

describe("", { tags: ["@tag.Widget", "@tag.Chart", "@tag.Snapshot"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.CHART);
  });

  it("1. Test Series tile chart", () => {
    propPane.SelectPropertiesDropDown("Chart Type", "Pie chart");
    propPane.UpdatePropertyFieldValue(
      "Title",
      "Data of anime at 2020 @ December",
    );
    agHelper.AssertAutoSave();
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/piechartsnapshotwithtitle");
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
  });

  it("2. Test Adaptive axis", () => {
    propPane.SelectPropertiesDropDown("Chart Type", "Column chart");
    agHelper.AssertAutoSave();
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/columnchartsnapshotwithoutadaptiveaxis");
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.TogglePropertyState("Adaptive axis", "On");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/columnchartsnapshotwithadaptiveaxis");
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
  });

  it("3. Test x axis label orientation chart", () => {
    propPane.SelectPropertiesDropDown("Chart Type", "Line chart");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot("chartwidget/linechartWithAutoXAxisLabelOrientation");
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.SelectPropertiesDropDown("x-axis label orientation", "Slant");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot(
        "chartwidget/linechartWithSlantXAxisLabelOrientation",
      );
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
    propPane.SelectPropertiesDropDown("x-axis label orientation", "Rotate");
    deployMode.DeployApp();
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CHART))
      .matchImageSnapshot(
        "chartwidget/linechartWithRotateXAxisLabelOrientation",
      );
    deployMode.NavigateBacktoEditor();
    EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
  });

  it("4. Test x axis label orientation absence  in Pie, Bar, Custom Fusion Charts", () => {
    propPane.SelectPropertiesDropDown("Chart Type", "Pie chart");
    agHelper.AssertElementAbsence(
      propPane._selectPropDropdown("x-axis label orientation"),
    );
    propPane.SelectPropertiesDropDown("Chart Type", "Bar chart");
    agHelper.AssertElementAbsence(
      propPane._selectPropDropdown("x-axis label orientation"),
    );
    propPane.SelectPropertiesDropDown(
      "Chart Type",
      "Custom Fusion Charts (deprecated)",
    );
    agHelper.AssertElementAbsence(
      propPane._selectPropDropdown("x-axis label orientation"),
    );
    propPane.SelectPropertiesDropDown("Chart Type", "Column chart");
    agHelper.AssertElementExist(
      propPane._selectPropDropdown("x-axis label orientation"),
    );
  });
});
