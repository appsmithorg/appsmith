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
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Statbox spec",
  { tags: ["@tag.All", "@tag.Statbox", "@tag.Binding"] },
  () => {
    before(() => {
      /**
       * On the canvas we have a Statbox Widget
       */
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.STATBOX, 329, 124);
    });

    it("1. Validate all the respective properties are present on the Content and Style sections in the property pane", () => {
      const generalProperties = ["visible", "animateloading", "height"];

      generalProperties.forEach((generalSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "general",
            `${generalSectionProperty}`,
          ),
        );
      });

      // Switch to the Style Tab
      propPane.MoveToTab("Style");

      const colorProperties = ["backgroundcolor", "bordercolor"];
      colorProperties.forEach((labelStyleSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "color",
            `${labelStyleSectionProperty}`,
          ),
        );
      });

      const borderShadows = ["borderwidth", "borderradius", "boxshadow"];
      borderShadows.forEach((borderShadowSectionProperty) => {
        agHelper.AssertElementVisibility(
          propPane._propertyPanePropertyControl(
            "borderandshadow",
            `${borderShadowSectionProperty}`,
          ),
        );
      });
    });
    it("2. Validate if the default widgets are present inside the statbox", () => {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.assertPresence("Statbox1");
      PageLeftPane.expandCollapseItem("Statbox1");
      PageLeftPane.assertPresence("Text1");
      PageLeftPane.assertPresence("Text2");
      PageLeftPane.assertPresence("IconButton1");
      PageLeftPane.assertPresence("Text3");
    });
    it("3. Validate visibility", () => {
      EditorNavigation.SelectEntityByName("Statbox1", EntityType.Widget);
      propPane.MoveToTab("Content");
      propPane.TogglePropertyState("Visible", "Off");
      // Ensure that the widget isnt visible once deployed
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(locators._widgetInDeployed("statbox1"));
      deployMode.NavigateBacktoEditor();
      //Ensure that the widget is not visible in preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementAbsence(locators._widgetInDeployed("statbox1"));
      agHelper.GetNClick(locators._exitPreviewMode);
      EditorNavigation.SelectEntityByName("Statbox1", EntityType.Widget);
      propPane.TogglePropertyState("Visible", "On");
      //Ensure that the widget is visible once deployed
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("statbox1"),
        true,
      );
      deployMode.NavigateBacktoEditor();
      //Ensure that the widget is visible in preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("statbox1"),
        true,
      );
      agHelper.GetNClick(locators._exitPreviewMode);
    });

    it("4. Validate if widgets can be D&D inside the Statbox widget", () => {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.expandCollapseItem("Statbox1");
      propPane.DeleteWidgetFromPropertyPane("IconButton1");
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.ICONBUTTON,
        260,
        189,
      );
      //Verifying if the dropped widget exists in the container
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.expandCollapseItem("Statbox1");
      PageLeftPane.assertPresence("IconButton1");
      //Verifying if the dropped widget exists once deployed
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("iconbutton1"),
        true,
      );
      deployMode.NavigateBacktoEditor();
      //Verifying if the dropped widget exists in preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("iconbutton1"),
        true,
      );
      agHelper.GetNClick(locators._exitPreviewMode);
    });

    it("5: Verify statbox widget styles", () => {
      EditorNavigation.SelectEntityByName("Statbox1", EntityType.Widget);
      //Switch to Style tab
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Background color", "#f3e8ff");
      propPane.EnterJSContext("Border color", "#be185d");
      // Click on Deploy and ensure it is deployed appropriately
      deployMode.DeployApp();
      // Ensure the Background Color is applied
      agHelper.AssertCSS(
        locators._statboxWidget,
        "background-color",
        "rgb(243, 232, 255)",
      );
      //Ensure that the border colour is applied
      agHelper.AssertCSS(
        locators._statboxWidget,
        "border-color",
        "rgb(205, 213, 223)",
      );
      deployMode.NavigateBacktoEditor();
    });

    it("6. Rename, copy-paste and delete the widget", () => {
      EditorNavigation.SelectEntityByName("Statbox1", EntityType.Widget);
      entityExplorer.RenameEntityFromExplorer("Statbox1", "Stats", true);
      propPane.CopyPasteWidgetFromPropertyPane("Stats");
      entityExplorer.DeleteWidgetFromEntityExplorer("Stats");
    });
  },
);
