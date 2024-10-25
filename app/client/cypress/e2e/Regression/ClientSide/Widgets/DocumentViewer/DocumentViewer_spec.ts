import {
  entityExplorer,
  agHelper,
  locators,
  deployMode,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import {
  encodedWordDoc,
  encodedXlsxDoc,
  encodedXlsDoc,
} from "../../../../../fixtures/exampleEncodedDocs";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const ppt =
  "http://host.docker.internal:4200/ppt-on-population-pptxafa26c44-208f-46a3-89cc-8a5c020b6863.pptx";
const pngImage = "https://www.appsmith.com/favicon.png";
const jpgImage =
  "https://community.appsmith.com/sites/default/files/styles/small_thumbnail/public/2024-03/aws-logo.jpg?itok=yG4bpfFs";
const pdf = "http://host.docker.internal:4200/sample-pdf-file.pdf";

describe(
  "DocumentViewer Widget Functionality",
  { tags: ["@tag.Widget", "@tag.DocumentViewer", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("filepickerwidgetv2", 400, 900);
      entityExplorer.DragDropWidgetNVerify("documentviewerwidget", 300, 300);
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl("data", "documentlink"),
      );
      agHelper.AssertElementVisibility(
        propPane._propertyPanePropertyControl("general", "visible"),
      );
    });

    afterEach(() => {
      deployMode.NavigateBacktoEditor();
    });
    it("1.  Modify visibility & Publish app & verify", () => {
      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "not.exist",
      );
      deployMode.NavigateBacktoEditor();
      //Change visibility & Publish app & verify again
      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp();
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "exist",
      );
    });

    it("2. Should show a word document correctly", () => {
      // Verify when user uploads file
      const fixturePath = "cypress/fixtures/testDoc.docx";
      agHelper.GetNClick(locators._widgetInDeployed("filepicker1"));
      agHelper
        .GetElement(locators._ds_uppy_fileInput)
        .first()
        .selectFile(fixturePath, {
          force: true,
        });
      agHelper.GetNClick(locators._uploadBtn);

      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Document link",
        "{{FilePicker1.files[0].data}}",
      );
      agHelper.AssertContains("This is an essay");

      // Verify by entering link
      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Document link", encodedWordDoc);
      deployMode.DeployApp();
      //"Some doc content" is pressent in the encoded word doc
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "contain",
        "Some doc content",
      );
    });

    it("3. Should show an errored state when a malformed docx input is provided", () => {
      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      const someGarbageString = "+dsds";
      // previously the document is set as "Some doc content"
      // give a corrupted docx string
      propPane.UpdatePropertyFieldValue(
        "Document link",
        encodedWordDoc + someGarbageString,
      );
      deployMode.DeployApp();
      // now the doc should not contain "Some doc content" after a malformed input is provided
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "not.contain",
        "Some doc content",
      );
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "contain",
        "invalid base64 data",
      );
    });

    it("4. Should show a xlsx/xls document correctly and should be able to render different documents without having to add the widget again", () => {
      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Document link", encodedXlsxDoc);
      deployMode.DeployApp();
      //"456" is pressent in the encoded xlsx doc
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "contain",
        "r1a",
      );
      cy.get(locators._widgetInDeployed("documentviewerwidget"))
        .get('button:contains("Copy of Sheet1")')
        .click();
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "contain",
        "SHEET 2r1a",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Document link", encodedXlsDoc);
      deployMode.DeployApp();
      //"456" is pressent in the encoded xlsx doc
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "contain",
        "First Name",
      );
    });

    it("5. Should show an errored state when a malformed xlsx input is provided", () => {
      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      // previously the document contains the number "456"
      const someGarbageString = "+dsds";
      //give a corrupted xlsx doc string
      propPane.UpdatePropertyFieldValue(
        "Document link",
        encodedXlsxDoc + someGarbageString,
      );
      deployMode.DeployApp();
      // now the doc should not contain "456" after a malformed input is provided
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "not.contain",
        "456",
      );
      cy.get(locators._widgetInDeployed("documentviewerwidget")).should(
        "contain",
        "invalid base64 data",
      );
    });

    it("6. Verify ppt file upload and ppt link", () => {
      // Verify when user uploads from local files
      const fixturePath = "cypress/fixtures/test.ppt";
      agHelper.GetNClick(locators._widgetInDeployed("filepicker1"));
      agHelper
        .GetElement(locators._ds_uppy_fileInput)
        .first()
        .selectFile(fixturePath, {
          force: true,
        });
      agHelper.GetNClick(locators._uploadBtn);

      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Document link",
        "{{FilePicker1.files[0].data}}",
      );
      agHelper.AssertContains("Current file type is not supported");

      // Verify by entering link
      propPane.UpdatePropertyFieldValue("Document link", ppt);
      deployMode.DeployApp();
      agHelper.AssertElementExist(
        locators._widgetInDeployed("documentviewerwidget"),
      );
      agHelper.AssertContains(
        "Current file type is not supported",
        "not.exist",
      );
    });

    it("7. Validate with different image file", () => {
      // Verify when user uploads from local files
      const fixturePath = "cypress/fixtures/AAAFlowerVase.jpeg";
      agHelper.GetNClick(locators._widgetInDeployed("filepicker1"));
      agHelper
        .GetElement(locators._ds_uppy_fileInput)
        .first()
        .selectFile(fixturePath, {
          force: true,
        });
      agHelper.GetNClick(locators._uploadBtn);

      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Document link",
        "{{FilePicker1.files[0].data}}",
      );
      agHelper.AssertContains("Current file type is not supported");
      //Should show an png image file
      propPane.UpdatePropertyFieldValue("Document link", pngImage);
      deployMode.DeployApp();
      agHelper.AssertElementExist(
        locators._widgetInDeployed("documentviewerwidget"),
      );
      agHelper.AssertContains("Current file type is not supported");
      deployMode.NavigateBacktoEditor();
      //Should not show an jpg image file"
      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Document link", jpgImage);
      deployMode.DeployApp();
      agHelper.AssertContains("Current file type is not supported");
    });

    it("8. Should show a pdf file", () => {
      // Verify when user uploads a file
      const fixturePath = "cypress/fixtures/sample-pdf-file.pdf";
      agHelper.GetNClick(locators._widgetInDeployed("filepicker1"));
      agHelper
        .GetElement(locators._ds_uppy_fileInput)
        .first()
        .selectFile(fixturePath, {
          force: true,
        });
      agHelper.GetNClick(locators._uploadBtn);

      EditorNavigation.SelectEntityByName("DocumentViewer1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Document link",
        "{{FilePicker1.files[0].data}}",
      );
      agHelper.AssertElementExist(
        locators._widgetInDeployed("documentviewerwidget"),
      );
      agHelper.AssertContains(
        "Current file type is not supported",
        "not.exist",
      );

      // Verify pdf link
      propPane.UpdatePropertyFieldValue("Document link", pdf);
      deployMode.DeployApp();
      agHelper.AssertElementExist(
        locators._widgetInDeployed("documentviewerwidget"),
      );
      agHelper.AssertContains(
        "Current file type is not supported",
        "not.exist",
      );
    });
  },
);
