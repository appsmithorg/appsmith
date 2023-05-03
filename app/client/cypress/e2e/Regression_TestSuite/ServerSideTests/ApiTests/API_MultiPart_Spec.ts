import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Validate API request body panel", () => {
  it.only("1. Check whether input and type dropdown selector exist when multi-part is selected", () => {
    _.apiPage.CreateApi("FirstAPI", "POST");
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("FORM_URLENCODED");
    _.agHelper.AssertElementVisible(_.apiPage._bodyKey(0));
    _.agHelper.AssertElementVisible(_.apiPage._bodyValue(0));
    _.apiPage.SelectSubTab("MULTIPART_FORM_DATA");
    _.agHelper.AssertElementVisible(_.apiPage._bodyKey(0));
    _.agHelper.AssertElementVisible(_.apiPage._bodyTypeDropdown);
    _.agHelper.AssertElementVisible(_.apiPage._bodyValue(0));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it.only("2. Checks whether No body error message is shown when None API body content type is selected", function () {
    _.apiPage.CreateApi("FirstAPI", "GET");
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("NONE");
    cy.get(_.apiPage._noBodyMessageDiv).contains(_.apiPage._noBodyMessage);
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("3. Checks whether header content type is being changed when FORM_URLENCODED API body content type is selected", function () {
    _.apiPage.CreateApi("FirstAPI", "POST");
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("JSON");
    _.apiPage.ValidateImportedHeaderParams(true, {
      key: "content-type",
      value: "application/json",
    });
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("FORM_URLENCODED");
    _.apiPage.ValidateImportedHeaderParams(true, {
      key: "content-type",
      value: "application/x-www-form-urlencoded",
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("4. Checks whether header content type is being changed when MULTIPART_FORM_DATA API body content type is selected", function () {
    _.apiPage.CreateApi("FirstAPI", "POST");
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("JSON");
    _.apiPage.ValidateImportedHeaderParams(true, {
      key: "content-type",
      value: "application/json",
    });
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("MULTIPART_FORM_DATA");
    _.apiPage.ValidateImportedHeaderParams(true, {
      key: "content-type",
      value: "multipart/form-data",
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("5. Checks whether content type 'FORM_URLENCODED' is preserved when user selects None API body content type", function () {
    _.apiPage.CreateApi("FirstAPI", "POST");
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("FORM_URLENCODED");
    _.apiPage.SelectSubTab("NONE");
    _.apiPage.ValidateImportedHeaderParamsAbsence(true);
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("6. Checks whether content type 'MULTIPART_FORM_DATA' is preserved when user selects None API body content type", function () {
    _.apiPage.CreateApi("FirstAPI", "POST");
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("MULTIPART_FORM_DATA");
    _.apiPage.SelectSubTab("NONE");
    _.apiPage.ValidateImportedHeaderParamsAbsence(true);
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("7. Checks MultiPart form data for a File Type upload + Bug 12476", () => {
    const imageNameToUpload = "ConcreteHouse.jpg";
    cy.fixture("multiPartFormDataDsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });

    _.apiPage.CreateAndFillApi(
      "https://api.cloudinary.com/v1_1/appsmithautomationcloud/image/upload?upload_preset=fbbhg4xu",
      "CloudinaryUploadApi",
      30000,
      "POST",
    );
    _.apiPage.EnterBodyFormData(
      "MULTIPART_FORM_DATA",
      "file",
      "{{FilePicker1.files[0]}}",
      "File",
    );

    _.jsEditor.CreateJSObject(
      `export default {
            myVar1: [],
            myVar2: {},
            upload: async () => {
                await CloudinaryUploadApi.run().then(()=> showAlert('Image uploaded to Cloudinary successfully', 'success')).catch(err => showAlert(err.message, 'error'));
                await resetWidget('FilePicker1', true);
            }
        }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    _.entityExplorer.SelectEntityByName("FilePicker1", "Widgets");
    _.propPane.EnterJSContext("onFilesSelected", `{{JSObject1.upload()}}`);

    _.entityExplorer.SelectEntityByName("Image1");
    _.propPane.UpdatePropertyFieldValue(
      "Image",
      "{{CloudinaryUploadApi.data.url}}",
    );

    _.entityExplorer.SelectEntityByName("CloudinaryUploadApi", "Queries/JS");

    _.apiPage.ToggleOnPageLoadRun(false); //Bug 12476
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp(_.locators._spanButton("Select Files"));
    _.agHelper.ClickButton("Select Files");
    _.agHelper.UploadFile(imageNameToUpload);
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute"); //validating Cloudinary api call
    _.agHelper.ValidateToastMessage(
      "Image uploaded to Cloudinary successfully",
    );
    _.agHelper.Sleep();
    cy.xpath(_.apiPage._imageSrc)
      .find("img")
      .invoke("attr", "src")
      .then(($src) => {
        expect($src).not.eq("https://assets.appsmith.com/widgets/default.png");
      });
    _.agHelper.AssertElementVisible(_.locators._spanButton("Select Files")); //verifying if reset!
    _.deployMode.NavigateBacktoEditor();
  });

  it("8. Checks MultiPart form data for a Array Type upload results in API error", () => {
    const imageNameToUpload = "AAAFlowerVase.jpeg";
    _.entityExplorer.SelectEntityByName("CloudinaryUploadApi", "Queries/JS");
    _.apiPage.EnterBodyFormData(
      "MULTIPART_FORM_DATA",
      "file",
      "{{FilePicker1.files[0]}}",
      "Array",
      true,
    );
    _.entityExplorer.SelectEntityByName("FilePicker1", "Widgets");
    _.agHelper.ClickButton("Select Files");
    _.agHelper.UploadFile(imageNameToUpload);
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute", false);

    _.deployMode.DeployApp(_.locators._spanButton("Select Files"));
    _.agHelper.ClickButton("Select Files");
    _.agHelper.UploadFile(imageNameToUpload);
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute", false);
    _.agHelper.ValidateToastMessage("CloudinaryUploadApi failed to execute");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Select Files")); //verifying if reset in case of failure!
  });
});
