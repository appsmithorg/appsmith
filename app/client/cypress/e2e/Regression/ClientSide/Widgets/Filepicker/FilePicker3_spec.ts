import {
  agHelper,
  locators,
  entityExplorer,
  deployMode,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Verify file picker widget",
  { tags: ["@tag.Widget", "@tag.Filepicker", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("filepickerDsl");
    });
    it("1. Verify property visibility", () => {
      const basicProperties = [
        "allowedfiletypes",
        "dataformat",
        `maxno\\.offiles`,
      ];

      const labelProperties = ["text"];

      const validationProperties = ["required", "maxfilesize\\(mb\\)"];

      const generalProperties = ["visible", "disable", "animateloading"];

      const eventsProperties = ["onfilesselected"];

      const styleColorProperties = ["buttoncolor"];

      const styleBorderProperties = ["borderradius", "boxshadow"];

      EditorNavigation.SelectEntityByName("FilePicker1", EntityType.Widget);

      propPane.AssertPropertyVisibility(basicProperties, "basic");
      propPane.AssertPropertyVisibility(labelProperties, "label");
      propPane.AssertPropertyVisibility(validationProperties, "validation");
      propPane.AssertPropertyVisibility(generalProperties, "general");
      propPane.AssertPropertyVisibility(eventsProperties, "events");
      propPane.MoveToTab("Style");
      propPane.AssertPropertyVisibility(styleColorProperties, "color");
      propPane.AssertPropertyVisibility(
        styleBorderProperties,
        "borderandshadow",
      );
    });

    it("2. Verify Renaming, duplication and deletion", () => {
      // Rename and verify
      entityExplorer.RenameEntityFromExplorer(
        "FilePicker1",
        "NewFilePicker",
        true,
      );
      agHelper.AssertElementVisibility(locators._widgetName("NewFilePicker"));

      // Copy and paste widget using cmd+c and cmd+v
      entityExplorer.CopyPasteWidget("NewFilePicker");
      PageLeftPane.assertPresence("NewFilePickerCopy");
      entityExplorer.DeleteWidgetFromEntityExplorer("NewFilePickerCopy");

      // Copy paste from property pane and delete from property pane
      propPane.CopyPasteWidgetFromPropertyPane("NewFilePicker");
      propPane.DeleteWidgetFromPropertyPane("NewFilePickerCopy");
      EditorNavigation.SelectEntityByName("NewFilePicker", EntityType.Widget);
      propPane.MoveToTab("Content");
    });

    it("3. Verify max number of files", () => {
      agHelper.AssertText(locators._buttonText, "text", "Select Files");
      propPane.UpdatePropertyFieldValue("Max no. of files", "2");
      agHelper.ClickButton("Select Files");
      agHelper.UploadFile("AAAFlowerVase.jpeg");
      // Verify Add more is visible
      agHelper.GetNClick(locators._buttonInDeployedMode, 0, true);
      agHelper.AssertElementVisibility(locators._fileUploadAddMore);
      agHelper.GetNClick(locators._fileUploadAddMore);

      // Verify Add more does not exist when max no. files are added
      agHelper.UploadFile("appsmithlogo.png");
      agHelper.GetNClick(locators._buttonInDeployedMode, 0, true);
      agHelper.AssertElementAbsence(locators._fileUploadAddMore);
      agHelper.GetNClick(locators._fileUploadDashboardClose);

      agHelper.AssertText(locators._buttonText, "text", "2 files selected");
    });

    it("4. Verify Validation max file size supported", () => {
      propPane.UpdatePropertyFieldValue("Max file size(Mb)", "1");
      agHelper.GetNClick(locators._buttonInDeployedMode, 0, true);
      agHelper.GetNClick('[title="Remove file"]');
      agHelper.GetNClick(locators._fileUploadAddMore);
      agHelper
        .GetElement(locators._uploadFiles)
        .eq(0)
        .selectFile("cypress/fixtures/Appsmith.gif", { force: true })
        .wait(3000);
      agHelper.AssertElementVisibility(
        locators._fileUploadErrorContains(
          "This file exceeds maximum allowed size of 1 MB ",
        ),
      );
      agHelper.GetNClick(locators._fileUploadDashboardClose);
    });

    it("5. Validate visible and disabled toggle", () => {
      propPane.TogglePropertyState("visible", "Off");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed("filepickerwidgetv2"),
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed("filepickerwidgetv2"),
      );
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewFilePicker", EntityType.Widget);
      propPane.TogglePropertyState("visible", "On");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("filepickerwidgetv2"),
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed("filepickerwidgetv2"),
      );
      deployMode.NavigateBacktoEditor();

      // Visible JS mode
      EditorNavigation.SelectEntityByName("NewFilePicker", EntityType.Widget);
      propPane.ToggleJSMode("Visible", true);
      propPane.UpdatePropertyFieldValue("Visible", "false");

      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed("filepickerwidgetv2"),
      );
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewFilePicker", EntityType.Widget);
      propPane.ToggleJSMode("Visible", true);
      propPane.UpdatePropertyFieldValue("Visible", "true");
      propPane.ToggleJSMode("Visible", false);

      // Disabled
      propPane.TogglePropertyState("disable", "On");
      agHelper.AssertAttribute(
        locators._widgetInDeployed("filepickerwidgetv2"),
        "disabled",
        "disabled",
      );

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertAttribute(
        locators._widgetInDeployed("filepickerwidgetv2"),
        "disabled",
        "disabled",
      );
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertAttribute(
        locators._widgetInDeployed("filepickerwidgetv2"),
        "disabled",
        "disabled",
      );
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("NewFilePicker", EntityType.Widget);
      propPane.TogglePropertyState("disable", "Off");
    });

    it("6. Verify onFilesSelected", () => {
      propPane.ToggleJSMode("onFilesSelected", true);
      propPane.UpdatePropertyFieldValue(
        "onFilesSelected",
        "{{showAlert('File Selected', '');}}",
      );
      deployMode.DeployApp();
      agHelper.ClickButton("Select Files");
      agHelper.UploadFile("appsmithlogo.png");
      agHelper.ValidateToastMessage("File Selected");
      deployMode.NavigateBacktoEditor();
    });

    it("7. Verify button color and border and shadows", () => {
      EditorNavigation.SelectEntityByName("NewFilePicker", EntityType.Widget);
      // Verify button color picker opens up
      propPane.MoveToTab("Style");
      agHelper.GetNClick(propPane._propertyControlColorPicker("buttoncolor"));
      agHelper.AssertElementVisibility(propPane._colorPickerV2Color);
      // Verify full color picker
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "text", 0);
      propPane.TogglePropertyState("buttoncolor", "On", "");
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "color", 0);

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
  },
);
