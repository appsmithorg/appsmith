const commonlocators = require("../../../../locators/commonlocators.json");
import {
  agHelper,
  apiPage,
  dataManager,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

//skipping this due to : https://github.com/appsmithorg/appsmith/issues/38156
describe.skip(
  "To test [Bug]: A-force -> Not being able to upload file using binary format and multi part form data #34123",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    // Bug: https://github.com/appsmithorg/appsmith/issues/34123
    it("1. Validate whether file >20MB can be uploaded", () => {
      // Step 1: Add a File Picker widget and configure it
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.FILEPICKER);

      // Set allowed file types
      propPane.EnterJSContext("Allowed file types", `["*"]`);

      // Set file data format to 'Array of Objects'
      cy.get(commonlocators.filePickerDataFormat).click({ force: true });
      cy.contains("Array of Objects").should("be.visible").click();

      // Set max file size to 50MB
      propPane.UpdatePropertyFieldValue("Max file size(Mb)", "50");

      // Step 2: Upload a file greater than 20MB
      agHelper.ClickButton("Select Files");
      agHelper.UploadFile("FileGreaterThan20MB.json");

      // Assert that the file is selected
      agHelper.AssertText(locators._buttonText, "text", "1 files selected");

      // Step 3: Create and configure the API
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].multipartAPI,
        "TestUpload20MB",
        80000,
        "POST",
      );
      apiPage.EnterBodyFormData(
        "MULTIPART_FORM_DATA",
        "file",
        "{{FilePicker1.files[0]}}",
        "File",
      );

      // Step 4: Run the API and verify the response
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200");

      // Assert the response contains the uploaded file name
      cy.get(apiwidget.responseText).contains(
        `"file": "FileGreaterThan20MB.json"`,
      );
    });
  },
);
