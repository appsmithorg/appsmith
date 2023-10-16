import {
  agHelper,
  locators,
  deployMode,
  entityExplorer,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import { buttongroupwidgetlocators } from "../../../../../locators/WidgetLocators";

describe("Menu Button widget Tests", function () {
  before(() => {
    agHelper.AddDsl("menuButtonDsl");
  });

  it("1. Verify property visibility", function () {
    const basicProperties = ["label", "menuitemssource", "menuitems"];
    const generalProperties = [
      "visible",
      "disabled",
      "animateloading",
      "compact",
    ];

    const styleGeneralProperties = ["buttonvariant"];
    const styleIconProperties = ["icon", "position", "placement"];
    const colorProperties = ["buttoncolor"];
    const styleBorderProperties = ["borderradius", "boxshadow"];

    entityExplorer.SelectEntityByName("MenuButton1", "Widgets");

    basicProperties.forEach((basicSectionProperty) => {
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl(
          "basic",
          `${basicSectionProperty}`,
        ),
      );
    });

    generalProperties.forEach((generalSectionProperty) => {
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl(
          "general",
          `${generalSectionProperty}`,
        ),
      );
    });

    propPane.MoveToTab("Style");

    styleGeneralProperties.forEach((generalSectionProperty) => {
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl(
          "general",
          `${generalSectionProperty}`,
        ),
      );
    });

    styleIconProperties.forEach((iconSectionProperty) => {
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl("icon", `${iconSectionProperty}`),
      );
    });

    colorProperties.forEach((colorSectionProperty) => {
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl(
          "color",
          `${colorSectionProperty}`,
        ),
      );
    });

    styleBorderProperties.forEach((borderSectionProperty) => {
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl(
          "borderandshadow",
          `${borderSectionProperty}`,
        ),
      );
    });
  });

  it("2. Verify Renaming, duplication and deletion", () => {
    // Rename and verify
    entityExplorer.RenameEntityFromExplorer(
      "MenuButton1",
      "NewMenuButton",
      true,
    );
    agHelper.AssertElementVisibility(locators._widgetName("NewMenuButton"));

    // Copy and paste widget using cmd+c and cmd+v
    entityExplorer.CopyPasteWidget("NewMenuButton");
    entityExplorer.AssertEntityPresenceInExplorer("NewMenuButtonCopy");
    entityExplorer.DeleteWidgetFromEntityExplorer("NewMenuButtonCopy");

    // Copy paste from property pane and delete from property pane
    propPane.CopyPasteWidgetFromPropertyPane("NewMenuButton");
    propPane.DeleteWidgetFromPropertyPane("NewMenuButtonCopy");
    entityExplorer.SelectEntityByName("NewMenuButton", "Widgets");
    propPane.MoveToTab("Content");
  });

  it("3. Verify changing label text", () => {
    propPane.UpdatePropertyFieldValue("Label", "Open Menu New");
    agHelper.AssertText(locators._buttonText, "text", "Open Menu New");
  });

  it("4. Validating menu items", () => {
    // Add Item
    agHelper
      .GetElementLength(locators._propertyControlInput("menuitems"))
      .then((initialLength) => {
        agHelper.GetNClick(propPane._addMenuItem);
        agHelper
          .GetElementLength(locators._propertyControlInput("menuitems"))
          .then((finalLength) => {
            expect(finalLength).to.be.eq(initialLength + 1);
          });
      });

    // Delete item
    agHelper.GetNClick(table._deleteColumn, 3);
    agHelper.AssertElementAbsence('[value="Menu Item 1"]');

    // Open Item Settings
    propPane.OpenTableColumnSettings("menuItem3");
    agHelper.AssertText(
      `${propPane._paneTitle} span`,
      "text",
      "Third Menu Item",
    );
    agHelper.GetNClick(propPane._goBackToProperty);

    // Update Item name
    agHelper.ClearNType(
      locators._propertyControlInput("menuitems"),
      "First Menu Item New",
      0,
    );
    agHelper.GetNClick(locators._widgetInDeployed("menubuttonwidget"));
    agHelper.AssertElementExist(
      buttongroupwidgetlocators.buttonMenuOptions("First Menu Item New"),
    );
  });

  it("5. Validate visible and disabled toggle", () => {
    propPane.TogglePropertyState("visible", "Off");

    // Preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed("menubuttonwidget"),
    );
    agHelper.GetNClick(locators._exitPreviewMode);

    // Deploy mode
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed("menubuttonwidget"),
    );
    deployMode.NavigateBacktoEditor();

    entityExplorer.SelectEntityByName("NewMenuButton", "Widgets");
    propPane.TogglePropertyState("visible", "On");

    // Preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed("menubuttonwidget"),
    );
    agHelper.GetNClick(locators._exitPreviewMode);

    // Deploy mode
    deployMode.DeployApp();
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed("menubuttonwidget"),
    );
    deployMode.NavigateBacktoEditor();

    // Visible JS mode
    entityExplorer.SelectEntityByName("NewMenuButton", "Widgets");
    propPane.ToggleJSMode("Visible", true);
    propPane.UpdatePropertyFieldValue("Visible", "false");

    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed("menubuttonwidget"),
    );
    deployMode.NavigateBacktoEditor();

    entityExplorer.SelectEntityByName("NewMenuButton", "Widgets");
    propPane.ToggleJSMode("Visible", true);
    propPane.UpdatePropertyFieldValue("Visible", "true");
    propPane.ToggleJSMode("Visible", false);

    // Disabled
    entityExplorer.SelectEntityByName("NewMenuButton", "Widgets");
    propPane.TogglePropertyState("disabled", "On");
    agHelper.AssertAttribute(
      locators._widgetInDeployed("menubuttonwidget"),
      "disabled",
      "disabled",
    );

    // Preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    agHelper.AssertAttribute(
      locators._widgetInDeployed("menubuttonwidget"),
      "disabled",
      "disabled",
    );
    agHelper.GetNClick(locators._exitPreviewMode);

    // Deploy mode
    deployMode.DeployApp();
    agHelper.AssertAttribute(
      locators._widgetInDeployed("menubuttonwidget"),
      "disabled",
      "disabled",
    );
    deployMode.NavigateBacktoEditor();

    entityExplorer.SelectEntityByName("NewMenuButton", "Widgets");
    propPane.TogglePropertyState("disabled", "Off");
  });

  it("6. Validate compact toggle", () => {
    propPane.TogglePropertyState("compact", "On");
    agHelper.GetNClick(locators._widgetInDeployed("menubuttonwidget"));
    agHelper.AssertCSS(locators._menuItem, "padding-top", "3px");
    propPane.TogglePropertyState("compact", "Off");
    agHelper.AssertCSS(locators._menuItem, "padding-top", "9px");
  });
});
