import {
  agHelper,
  locators,
  deployMode,
  entityExplorer,
  propPane,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Icon Button widget Tests",
  { tags: ["@tag.Widget", "@tag.IconButton", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.ICONBUTTON);
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.CURRENCY_INPUT,
        200,
        600,
      );

      EditorNavigation.SelectEntityByName("IconButton1", EntityType.Widget);
    });

    it("1. Verify property visibility", function () {
      const basicProperties = ["icon", "onclick"];

      const generalProperties = [
        "tooltip",
        "visible",
        "disabled",
        "animateloading",
      ];

      const styleGeneralProperties = ["buttonvariant"];

      const styleColorProperties = ["buttoncolor"];

      const styleBorderProperties = ["borderradius", "boxshadow"];

      propPane.AssertPropertyVisibility(basicProperties, "basic");
      propPane.AssertPropertyVisibility(generalProperties, "general");
      propPane.MoveToTab("Style");
      propPane.AssertPropertyVisibility(styleGeneralProperties, "general");
      propPane.AssertPropertyVisibility(styleColorProperties, "color");
      propPane.AssertPropertyVisibility(
        styleBorderProperties,
        "borderandshadow",
      );
    });

    it("2. Verify Renaming, duplication and deletion", () => {
      // Rename and verify
      entityExplorer.RenameEntityFromExplorer(
        "IconButton1",
        "NewIconButton",
        true,
      );
      agHelper.AssertElementVisibility(locators._widgetName("NewIconButton"));

      // Copy and paste widget using cmd+c and cmd+v
      entityExplorer.CopyPasteWidget("NewIconButton");
      PageLeftPane.assertPresence("NewIconButtonCopy");
      entityExplorer.DeleteWidgetFromEntityExplorer("NewIconButtonCopy");

      // Copy paste from property pane and delete from property pane
      propPane.CopyPasteWidgetFromPropertyPane("NewIconButton");
      propPane.DeleteWidgetFromPropertyPane("NewIconButtonCopy");
      EditorNavigation.SelectEntityByName("NewIconButton", EntityType.Widget);
      propPane.MoveToTab("Content");
    });

    it("3. Validate icon can be selected from dropdown and icon can be searched by typing", () => {
      // Select from dropdown
      agHelper.GetNClick(`${locators._propertyControl}icon`);
      agHelper.GetElement(propPane._iconDropdown).scrollTo("top");
      agHelper.GetNClick(propPane._dataIcon("airplane"));
      agHelper.AssertElementVisibility(
        `${locators._widgetInDeployed("iconbuttonwidget")} ${propPane._dataIcon(
          "airplane",
        )}`,
      );

      // Type and select
      agHelper.GetNClick(`${locators._propertyControl}icon`);
      agHelper.TypeText(`[placeholder="Filter..."]${locators._input}`, "flame");
      agHelper.AssertElementVisibility(propPane._dataIcon("flame"));
      agHelper.GetNClick(propPane._dataIcon("flame"));
      agHelper.AssertElementVisibility(
        `${locators._widgetInDeployed("iconbuttonwidget")} ${propPane._dataIcon(
          "flame",
        )}`,
      );

      // Icon can be set in JS mode
      propPane.ToggleJSMode("Icon", true);
      propPane.UpdatePropertyFieldValue("Icon", "add");
      agHelper.AssertElementVisibility(
        `${locators._widgetInDeployed("iconbuttonwidget")} ${propPane._dataIcon(
          "add",
        )}`,
      );
    });

    it("4. Verify tooltip", () => {
      // entityExplorer.DragDropWidgetNVerify("currencyinputwidget", 500, 300);
      EditorNavigation.SelectEntityByName("CurrencyInput1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Default value", "1000");
      EditorNavigation.SelectEntityByName("NewIconButton", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Tooltip", "{{CurrencyInput1.text}}");
      agHelper
        .GetElement(locators._widgetInDeployed("iconbuttonwidget"))
        .realHover();
      agHelper.AssertPopoverTooltip("1,000");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper
        .GetElement(locators._widgetInDeployed("iconbuttonwidget"))
        .realHover();
      agHelper.AssertPopoverTooltip("1,000");
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper
        .GetElement(locators._widgetInDeployed("iconbuttonwidget"))
        .realHover();
      agHelper.AssertPopoverTooltip("1,000");
      deployMode.NavigateBacktoEditor();
    });

    it("5. Validate visible and disabled toggle", () => {
      EditorNavigation.SelectEntityByName("NewIconButton", EntityType.Widget);
      propPane.TogglePropertyState("visible", "Off");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed("iconbuttonwidget"),
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed("iconbuttonwidget"),
      );
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewIconButton", EntityType.Widget);
      propPane.TogglePropertyState("visible", "On");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("iconbuttonwidget"),
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("iconbuttonwidget"),
      );
      deployMode.NavigateBacktoEditor();

      // Visible JS mode
      EditorNavigation.SelectEntityByName("NewIconButton", EntityType.Widget);
      propPane.ToggleJSMode("Visible", true);
      propPane.UpdatePropertyFieldValue("Visible", "false");

      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed("iconbuttonwidget"),
      );
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewIconButton", EntityType.Widget);
      propPane.ToggleJSMode("Visible", true);
      propPane.UpdatePropertyFieldValue("Visible", "true");
      propPane.ToggleJSMode("Visible", false);

      // Disabled
      EditorNavigation.SelectEntityByName("NewIconButton", EntityType.Widget);
      propPane.TogglePropertyState("disabled", "On");
      agHelper.AssertAttribute(
        locators._widgetInDeployed("iconbuttonwidget"),
        "disabled",
        "disabled",
      );

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertAttribute(
        locators._widgetInDeployed("iconbuttonwidget"),
        "disabled",
        "disabled",
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertAttribute(
        locators._widgetInDeployed("iconbuttonwidget"),
        "disabled",
        "disabled",
      );
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewIconButton", EntityType.Widget);
      propPane.TogglePropertyState("disabled", "Off");
    });

    it("6. Verify button color and border and shadows", () => {
      // Verify button color picker opens up
      propPane.MoveToTab("Style");
      agHelper.GetNClick(propPane._propertyControlColorPicker("buttoncolor"));
      agHelper.AssertElementVisibility(propPane._colorPickerV2Color);
      // Verify full color picker
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "text", 0);
      propPane.TogglePropertyState("buttoncolor", "On", "");
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "color", 0);

      // Verify Button variant
      agHelper.AssertCSS(
        locators._buttonInDeployedMode,
        "background-color",
        "rgb(85, 61, 233)",
      );
      agHelper.GetNClick(propPane._segmentedControl("SECONDARY"));
      agHelper.AssertCSS(
        locators._buttonInDeployedMode,
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
      propPane.ToggleJSMode("Button variant", true);
      propPane.UpdatePropertyFieldValue("Button variant", "PRIMARY");
      agHelper.AssertCSS(
        locators._buttonInDeployedMode,
        "background-color",
        "rgb(85, 61, 233)",
      );

      // Verify border
      agHelper.GetNClick(propPane._segmentedControl("0px"));
      agHelper.AssertCSS(
        locators._buttonInDeployedMode,
        "border-radius",
        "0px",
      );

      // Verify Box Shadow
      agHelper.GetNClick(
        `${propPane._segmentedControl("0")}:contains('Large')`,
      );
      agHelper.AssertCSS(
        locators._buttonInDeployedMode,
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      );
    });

    it("7. Verify onClick", () => {
      propPane.MoveToTab("Content");
      propPane.ToggleJSMode("onClick", true);
      propPane.UpdatePropertyFieldValue(
        "onClick",
        `{{navigateTo('http://host.docker:4200/', {}, 'NEW_WINDOW');}}`,
      );
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
      cy.window().then((win) => {
        // Stub `window.open` to prevent new tabs
        agHelper.GetNClick(`${locators._widgetInDeployed("iconbuttonwidget")}`);
        cy.stub(win, "open").as("windowOpenStub");
        agHelper
          .GetElement(locators._widgetInDeployed("iconbuttonwidget"))
          .then(($link) => {
            cy.wrap($link).click();
            cy.get("@windowOpenStub").should("have.been.called");
          });
      });
    });
  },
);
