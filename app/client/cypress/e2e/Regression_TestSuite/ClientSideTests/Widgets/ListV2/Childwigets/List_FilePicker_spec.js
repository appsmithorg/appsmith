const dsl = require("../../../../../../fixtures/Listv2/simpleLargeListv2.json");
const widgetsPage = require("../../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../../locators/commonlocators.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe(" File Picker Widget", function () {
  before(() => {
    cy.addDsl(dsl);
  });
  it("a. should test allowed values", function () {
    cy.dragAndDropToWidget("filepickerwidgetv2", "listwidgetv2", {
      x: 150,
      y: 50,
    });
    cy.openPropertyPane("filepickerwidgetv2");
    cy.get(".t--property-control-required .t--js-toggle").click({
      force: true,
    });
    cy.testJsontext("required", `{{currentIndex % 2 === 0 }}`);
    cy.get(".t--property-control-onfilesselected .t--js-toggle").click({
      force: true,
    });
    cy.testJsontext(
      "onfilesselected",
      `{{showAlert('Row ' + currentIndex + ' has ' + currentView.FilePicker1.files.length + ' File(s)')}}`,
    );
    cy.testJsontext(`maxno\\.offiles`, `{{currentIndex + 1}}`);
    cy.get(".t--property-control-allowedfiletypes .t--js-toggle").click({
      force: true,
    });
    cy.testJsontext("allowedfiletypes", `[".csv"]`);
    cy.get(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    ).should("not.exist");
    cy.testJsontext("allowedfiletypes", ".csv");
    cy.get(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    ).should("exist");
    cy.testJsontext("allowedfiletypes", `[".csv", ".doc"]`);
    cy.get(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    ).should("not.exist");
    cy.testJsontext("allowedfiletypes", `[]`);
    cy.get(
      ".t--property-control-allowedfiletypes .t--codemirror-has-error",
    ).should("not.exist");
  });
  it("b. Select Widgets isValid and onFilesSelected", function () {
    // Test for isValid === True
    cy.dragAndDropToWidget("textwidget", "listwidgetv2", {
      x: 550,
      y: 50,
    });

    cy.RenameWidgetFromPropertyPane("textwidget", "Text1", "FilePicker_Widget");
    cy.testJsontext(
      "text",
      "{{currentView.FilePicker1.isDirty}}_{{currentView.FilePicker1.isValid}}_{{currentView.FilePicker1.files[0]?.name}}",
    );
    cy.get(
      `${widgetSelector("FilePicker_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", `false_false_undefined`);

    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });

    cy.get(`.t--widget-textwidget ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `false_true_undefined`);

    cy.get(commonlocators.listPaginatePrevButton).click({
      force: true,
    });

    // Upload a new file
    cy.get(widgetsPage.filepickerwidgetv2).click();
    cy.get(commonlocators.filePickerInput).first().attachFile("testFile.mov");
    cy.get(commonlocators.filePickerUploadButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true_true_testFile.mov");
    cy.validateToastMessage("Row 0 has 1 File(s)");

    // Next Page
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });

    // Upload a new file
    cy.get(widgetsPage.filepickerwidgetv2).click();
    cy.get(commonlocators.filePickerInput).first().attachFile("testFile2.mov");
    cy.get(commonlocators.filePickerUploadButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should(
      "contain",
      "true_true_testFile2.mov",
    );
    cy.validateToastMessage("Row 1 has 1 File(s)");
    // Prev Page
    cy.get(commonlocators.listPaginatePrevButton).click({
      force: true,
    });

    // Check File is still selected
    cy.get(".t--widget-textwidget").should("contain", "true_true_testFile.mov");
  });

  it("c. File Widget Max No of Files", function () {
    cy.openPropertyPane("filepickerwidgetv2");

    cy.get(widgetsPage.filepickerwidgetv2).click();
    cy.get(commonlocators.AddMoreFiles).should("not.exist");
    cy.get(".uppy-Dashboard-close").click({ force: true });

    // Next Page
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    cy.get(widgetsPage.filepickerwidgetv2).click();
    cy.get(commonlocators.AddMoreFiles).should("have.text", "Add more");
    cy.get(".uppy-Dashboard-close").click({ force: true });

    // Prev Page
    cy.get(commonlocators.listPaginatePrevButton).click({
      force: true,
    });
  });
});
