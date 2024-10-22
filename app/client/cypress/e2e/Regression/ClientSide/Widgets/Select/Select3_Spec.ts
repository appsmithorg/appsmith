import {
  agHelper,
  dataSources,
  draggableWidgets,
  deployMode,
  entityExplorer,
  locators,
  propPane,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Select widget tests",
  { tags: ["@tag.Widget", "@tag.Select", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT);
    });

    it("1. Validate Server side filtering", () => {
      //Create postgres datasource
      dataSources.CreateDataSource("Postgres");
      dataSources.CreateQueryAfterDSSaved(
        "SELECT * FROM public.astronauts {{this.params.filterText ? `WHERE name LIKE '%${this.params.filterText}%'` : ''}} LIMIT 10;",
      );
      dataSources.ToggleUsePreparedStatement(false);
      dataSources.RunQuery();

      //Bind it to select widget
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.TogglePropertyState("Server side filtering", "On");
      propPane.ToggleJSMode("Server side filtering", true);
      propPane
        .EvaluateExistingPropertyFieldValue("Server side filtering")
        .then((val: any) => {
          expect(val).to.eq("true");
        });
      propPane.ToggleJSMode("Server side filtering", false);
      propPane.EnterJSContext(
        "Source Data",
        `
    {{Query1.data.map((d) => ({
      name: d.name,
      code: d.name
    }))}}
  `,
        true,
      );
      propPane.EnterJSContext(
        "onFilterUpdate",
        `
  {{Query1.run({filterText: Select1.filterText})}}
`,
        true,
      );
      propPane.ToggleJSMode("onFilterUpdate", false);
      propPane.SelectPlatformFunction("onFilterUpdate", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Value changed!",
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));

      //Validate filtered data
      agHelper.Sleep(6000); //Wait for widget to settle for CI failure
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.TypeText(widgetLocators.selectWidgetFilter, "Ulf");
      agHelper.Sleep(3000); //Wait for widget filter to settle for CI runs
      agHelper.AssertElementVisibility(
        locators._selectOptionValue("Ulf Merbold"),
        true,
      );
      agHelper.GetNClick(locators._selectOptionValue("Ulf Merbold"), 0, true);
      agHelper.Sleep(); //for the new value to be set
      agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
        expect($selectedValue).to.eq("Ulf Merbold");
      });
    });

    it("2. Validate renaming, duplication(copy, paste) & deletion of select widget", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      //Rename widget
      propPane.RenameWidget("Select1", "Select_Widget");
      agHelper.AssertContains(
        "Select_Widget",
        "be.visible",
        widgetLocators.widgetNameTag,
      );
      agHelper.GetNClick(locators._widgetInCanvas(draggableWidgets.SELECT));

      //Duplicate with hotkeys
      entityExplorer.CopyPasteWidget("Select_Widget");
      agHelper.ValidateToastMessage("Copied Select_Widget");
      agHelper.AssertContains(
        "Select_WidgetCopy",
        "be.visible",
        widgetLocators.widgetNameTag,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper
        .GetElement(locators._widgetInDeployed(draggableWidgets.SELECT))
        .should("have.length", 2);
      deployMode.NavigateBacktoEditor();

      //Duplicate from property pane
      EditorNavigation.SelectEntityByName(
        "Select_WidgetCopy",
        EntityType.Widget,
      );
      propPane.CopyPasteWidgetFromPropertyPane("Select_WidgetCopy");
      agHelper.ValidateToastMessage("Copied Select_WidgetCopy");
      agHelper.AssertContains(
        "Select_WidgetCopyCopy",
        "be.visible",
        widgetLocators.widgetNameTag,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper
        .GetElement(locators._widgetInDeployed(draggableWidgets.SELECT))
        .should("have.length", 3);
      deployMode.NavigateBacktoEditor();

      //Delete widget from property pane
      propPane.DeleteWidgetFromPropertyPane("Select_WidgetCopyCopy");

      //Delete widget using hotkeys
      EditorNavigation.SelectEntityByName(
        "Select_WidgetCopy",
        EntityType.Widget,
      );
      agHelper.PressDelete();
      agHelper.AssertContains(
        "Select_WidgetCopyCopy",
        "not.exist",
        widgetLocators.widgetNameTag,
      );
      agHelper.AssertContains(
        "Select_WidgetCopy",
        "not.exist",
        widgetLocators.widgetNameTag,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper
        .GetElement(locators._widgetInDeployed(draggableWidgets.SELECT))
        .should("have.length", 1);
    });
  },
);
