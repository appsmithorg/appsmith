import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    jsEditor = ObjectsRegistry.JSEditor,
    apiPage = ObjectsRegistry.ApiPage,
    locator = ObjectsRegistry.CommonLocators;

describe("Validate API request body panel", () => {
    it("1. Check whether input and type dropdown selector exist when multi-part is selected", () => {
        apiPage.CreateApi("FirstAPI", 'POST');
        apiPage.SelectAPITab('Body')
        apiPage.SelectSubTab('FORM_URLENCODED')
        apiPage.CheckElementPresence(apiPage._bodyKey(0))
        apiPage.CheckElementPresence(apiPage._bodyValue(0))
        apiPage.SelectSubTab('MULTIPART_FORM_DATA')
        apiPage.CheckElementPresence(apiPage._bodyKey(0))
        apiPage.CheckElementPresence(apiPage._bodyTypeDropdown)
        apiPage.CheckElementPresence(apiPage._bodyValue(0))
        agHelper.ActionContextMenuWithInPane('Delete')
    });

    it("2. Checks whether No body error message is shown when None API body content type is selected", function () {
        apiPage.CreateApi("FirstAPI", 'GET');
        apiPage.SelectAPITab('Body')
        apiPage.SelectSubTab('NONE')
        cy.get(apiPage._noBodyMessageDiv).contains(apiPage._noBodyMessage);
        agHelper.ActionContextMenuWithInPane('Delete')
    });

    it("3. Checks whether header content type is being changed when FORM_URLENCODED API body content type is selected", function () {
        apiPage.CreateApi("FirstAPI", 'POST');
        apiPage.ValidateHeaderParams({
            key: "content-type",
            value: "application/json",
        });
        apiPage.SelectAPITab('Body')
        apiPage.SelectSubTab('FORM_URLENCODED')
        apiPage.ValidateHeaderParams({
            key: "content-type",
            value: "application/x-www-form-urlencoded",
        });
        agHelper.ActionContextMenuWithInPane('Delete')
    });

    it("4. Checks whether header content type is being changed when MULTIPART_FORM_DATA API body content type is selected", function () {
        apiPage.CreateApi("FirstAPI", 'POST');
        apiPage.ValidateHeaderParams({
            key: "content-type",
            value: "application/json",
        });
        apiPage.SelectAPITab('Body')
        apiPage.SelectSubTab('MULTIPART_FORM_DATA')
        apiPage.ValidateHeaderParams({
            key: "content-type",
            value: "multipart/form-data",
        });
        agHelper.ActionContextMenuWithInPane('Delete')
    });

    it("5. Checks whether content type 'FORM_URLENCODED' is preserved when user selects None API body content type", function () {
        apiPage.CreateApi("FirstAPI", 'POST');
        apiPage.SelectAPITab('Body')
        apiPage.SelectSubTab('FORM_URLENCODED')
        apiPage.SelectSubTab('NONE')
        apiPage.ValidateHeaderParams({
            key: "content-type",
            value: "application/x-www-form-urlencoded",
        });
        agHelper.ActionContextMenuWithInPane('Delete')
    });

    it("6. Checks whether content type 'MULTIPART_FORM_DATA' is preserved when user selects None API body content type", function () {
        apiPage.CreateApi("FirstAPI", 'POST');
        apiPage.SelectAPITab('Body')
        apiPage.SelectSubTab('MULTIPART_FORM_DATA')
        apiPage.SelectSubTab('NONE')
        apiPage.ValidateHeaderParams({
            key: "content-type",
            value: "multipart/form-data",
        });
        agHelper.ActionContextMenuWithInPane('Delete')
    });

    it("7. Checks MultiPart form data for a File Type upload", () => {
        let imageNameToUpload = "ConcreteHouse.jpg";
        cy.fixture('multiPartFormDataDsl').then((val: any) => {
            agHelper.AddDsl(val)
        });

        apiPage.CreateAndFillApi('https://api.cloudinary.com/v1_1/appsmithautomationcloud/image/upload?upload_preset=fbbhg4xu', 'CloudinaryUploadApi', 'POST')
        apiPage.EnterBodyFormData('MULTIPART_FORM_DATA', 'file', '{{FilePicker1.files[0]}}', 'File')

        jsEditor.CreateJSObject(`export default {
            myVar1: [],
            myVar2: {},
            upload: async () => {
                await CloudinaryUploadApi.run().then(()=> showAlert('Image uploaded to Cloudinary successfully', 'success')).catch(err => showAlert(err.message, 'error'));
                await resetWidget('FilePicker1', true);
            }
        }`, true, true, false);

        ee.expandCollapseEntity("WIDGETS")//to expand widgets
        ee.SelectEntityByName("FilePicker1");
        jsEditor.EnterJSContext('onfilesselected', `{{JSObject1.upload()}}`, true, true);

        ee.SelectEntityByName("Image1");
        jsEditor.EnterJSContext('image', '{{CloudinaryUploadApi.data.url}}')

        agHelper.ClickButton('Select Files');
        agHelper.UploadFile(imageNameToUpload)
        agHelper.ValidateToastMessage("Image uploaded to Cloudinary successfully")
        agHelper.Sleep()
        cy.xpath(apiPage._imageSrc).find('img')
            .invoke('attr', 'src').then($src => {
                expect($src).not.eq("https://assets.appsmith.com/widgets/default.png")
            })
        apiPage.CheckElementPresence(locator._spanButton('Select Files'))//verifying if reset!

    });

    it("8. Checks MultiPart form data for a Array Type upload results in API error", () => {
        let imageNameToUpload = "AAAFlowerVase.jpeg";
        ee.expandCollapseEntity("QUERIES/JS")//to expand widgets
        ee.SelectEntityByName("CloudinaryUploadApi");
        apiPage.EnterBodyFormData('MULTIPART_FORM_DATA', 'file', '{{FilePicker1.files[0]}}', 'Array', true)
        ee.SelectEntityByName("FilePicker1");
        agHelper.ClickButton('Select Files');
        agHelper.UploadFile(imageNameToUpload, false)
        agHelper.ValidateToastMessage("CloudinaryUploadApi failed to execute")
        apiPage.CheckElementPresence(locator._spanButton('Select Files'))//verifying if reset!
        agHelper.AssertDebugError("Execution failed with status 400 BAD_REQUEST", '{"error":{"message":"Unsupported source URL: {\\"type\\":\\"image/jpeg\\"')

    });

});