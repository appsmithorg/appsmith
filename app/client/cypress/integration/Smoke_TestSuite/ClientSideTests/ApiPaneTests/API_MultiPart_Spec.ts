import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { ApiPage } from "../../../../support/Pages/ApiPage";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const apiPage = new ApiPage();

describe("Validate API request body panel", () => {
    it("1. Check whether input and type dropdown selector exist when multi-part is selected", () => {
        apiPage.CreateApi("FirstAPI");
        apiPage.SelectAPIVerb('POST')
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
        apiPage.CreateApi("FirstAPI");
        apiPage.SelectAPIVerb('GET')
        apiPage.SelectAPITab('Body')
        apiPage.SelectSubTab('NONE')
        cy.get(apiPage._noBodyMessageDiv).contains(apiPage._noBodyMessage);
        agHelper.ActionContextMenuWithInPane('Delete')
    });

    it("3. Checks whether header content type is being changed when FORM_URLENCODED API body content type is selected", function () {
        apiPage.CreateApi("FirstAPI");
        apiPage.SelectAPIVerb('POST')
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
        apiPage.CreateApi("FirstAPI");
        apiPage.SelectAPIVerb('POST')
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
        apiPage.CreateApi("FirstAPI");
        apiPage.SelectAPIVerb('POST')
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
        apiPage.CreateApi("FirstAPI");
        apiPage.SelectAPIVerb('POST')
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
        let imageNameToUpload = "NightView.jpeg";
        cy.fixture('multiPartFormDataDsl').then((val: any) => {
            agHelper.AddDsl(val)
        });
        agHelper.expandCollapseEntity("WIDGETS")//to expand widgets
        agHelper.SelectEntityByName("FilePicker1");
        jsEditor.EnterJSContext('onfilesselected', `{{Api1.run().then(()=> showAlert('Image uploaded to Cloudinary successfully', 'success'));
        resetWidget('FilePicker1', true)}}`, true, true);
        apiPage.CreateAndFillApi('https://api.cloudinary.com/v1_1/appsmithautomationcloud/image/upload?upload_preset=fbbhg4xu')
        apiPage.SelectAPIVerb('POST')
        apiPage.EnterBodyFormData('MULTIPART_FORM_DATA', 'file', '{{FilePicker1.files[0]}}', 'File')
        agHelper.SelectEntityByName("Image1");
        jsEditor.EnterJSContext('image', '{{Api1.data.url}}')
        agHelper.ClickButton('Select Files');
        agHelper.UploadFile(imageNameToUpload)
        agHelper.ValidateToastMessage("Image uploaded to Cloudinary successfully")
    });

});