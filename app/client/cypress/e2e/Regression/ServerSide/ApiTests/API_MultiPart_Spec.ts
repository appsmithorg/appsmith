import {
  agHelper,
  apiPage,
  assertHelper,
  dataManager,
  deployMode,
  entityItems,
  homePage,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Validate API request body panel",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
      homePage.ImportApp("apiMultiPartData.json");
    });

    it("1. Check whether input and type dropdown selector exist when multi-part is selected", () => {
      EditorNavigation.SelectEntityByName("FirstAPI", EntityType.Query);
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("FORM_URLENCODED");
      agHelper.AssertElementVisibility(apiPage._bodyKey(0));
      agHelper.AssertElementVisibility(apiPage._bodyValue(0));
      apiPage.SelectSubTab("MULTIPART_FORM_DATA");
      agHelper.AssertElementVisibility(apiPage._bodyKey(0));
      agHelper.AssertElementVisibility(apiPage._bodyTypeDropdown);
      agHelper.AssertElementVisibility(apiPage._bodyValue(0));
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("2. Checks whether No body error message is shown when None API body content type is selected", function () {
      EditorNavigation.SelectEntityByName("SecondAPI", EntityType.Query);
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("NONE");
      cy.get(apiPage._noBodyMessageDiv).contains(apiPage._noBodyMessage);
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("3. Checks whether header content type is being changed when FORM_URLENCODED API body content type is selected", function () {
      EditorNavigation.SelectEntityByName("ThirdAPI", EntityType.Query);
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("JSON");
      apiPage.ValidateImportedHeaderParams(true, {
        key: "content-type",
        value: "application/json",
      });
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("FORM_URLENCODED");
      apiPage.ValidateImportedHeaderParams(true, {
        key: "content-type",
        value: "application/x-www-form-urlencoded",
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("4. Checks whether header content type is being changed when MULTIPART_FORM_DATA API body content type is selected", function () {
      EditorNavigation.SelectEntityByName("FourthAPI", EntityType.Query);
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("JSON");
      apiPage.ValidateImportedHeaderParams(true, {
        key: "content-type",
        value: "application/json",
      });
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("MULTIPART_FORM_DATA");
      apiPage.ValidateImportedHeaderParams(true, {
        key: "content-type",
        value: "multipart/form-data",
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("5. Checks whether content type 'FORM_URLENCODED' is preserved when user selects None API body content type", function () {
      EditorNavigation.SelectEntityByName("FiveAPI", EntityType.Query);
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("FORM_URLENCODED");
      apiPage.SelectSubTab("NONE");
      apiPage.ValidateImportedHeaderParamsAbsence(true);
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("6. Checks whether content type 'MULTIPART_FORM_DATA' is preserved when user selects None API body content type", function () {
      EditorNavigation.SelectEntityByName("SixAPI", EntityType.Query);
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("MULTIPART_FORM_DATA");
      apiPage.SelectSubTab("NONE");
      apiPage.ValidateImportedHeaderParamsAbsence(true);
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("7. Checks MultiPart form data for a File Type upload + Bug 12476", () => {
      PageList.AddNewPage();
      const imageNameToUpload = "ConcreteHouse.jpg";
      agHelper.AddDsl("multiPartFormDataDsl");

      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].multipartAPI,
        "MultipartAPI",
        30000,
        "POST",
      );
      apiPage.EnterBodyFormData(
        "MULTIPART_FORM_DATA",
        "file",
        "{{FilePicker1.files[0].data}}",
        "File",
      );

      jsEditor.CreateJSObject(
        `export default {
            myVar1: [],
            myVar2: {},
            upload: async () => {
                await MultipartAPI.run().then(()=> showAlert('Image uploaded to multipart successfully', 'success')).catch(err => showAlert(err.message, 'error'));
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

      EditorNavigation.SelectEntityByName("FilePicker1", EntityType.Widget);
      propPane.EnterJSContext("onFilesSelected", `{{JSObject1.upload()}}`);

      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Image", "{{MultipartAPI.data.url}}");

      EditorNavigation.SelectEntityByName("MultipartAPI", EntityType.Api);

      apiPage.ToggleOnPageLoadRun("Manual"); //Bug 12476
      EditorNavigation.SelectEntityByName("Page2", EntityType.Page);
      deployMode.DeployApp(locators._buttonByText("Select Files"));
      agHelper.ClickButton("Select Files");
      agHelper.UploadFile(imageNameToUpload);
      assertHelper.AssertNetworkExecutionSuccess("@postExecute"); //validating Cloudinary api call
      agHelper.ValidateToastMessage("Image uploaded to multipart successfully");
      agHelper.Sleep();
      cy.xpath(apiPage._imageSrc)
        .find("img")
        .invoke("attr", "src")
        .then(($src) => {
          expect($src).not.eq(
            "http://host.docker.internal:4200/clouddefaultImage.png",
          );
        });
      agHelper.AssertElementVisibility(locators._buttonByText("Select Files")); //verifying if reset!
      deployMode.NavigateBacktoEditor();
    });
  },
);
