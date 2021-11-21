const commonlocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const dsl = require("../../../../fixtures/ImageAnnotatorDsl.json");

describe("Image Annotator Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("imageannotatorwidget");
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });

  it("Property: imageUrl", function() {
    const newImageUrl = "https://picsum.photos/200/300";
    cy.get(viewWidgetsPage.imageAnnotatorImageUrl)
      .first()
      .focus({ force: true })
      .type("{ctrl}{shift}{end}")
      .clear()
      .type(newImageUrl)
      .wait(2000);
    // Assert
    cy.get(viewWidgetsPage.imageAnnotatorWidget + " img")
      .invoke("attr", "src")
      .should("eq", newImageUrl);
    cy.closePropertyPane();
  });

  it("Property: imageAltText", function() {
    const newImageAltText = "Image for annotations";
    cy.get(viewWidgetsPage.imageAnnotatorImageAltText)
      .first()
      .focus({ force: true })
      .type(newImageAltText)
      .wait(2000);
    // Assert
    cy.get(viewWidgetsPage.imageAnnotatorWidget + " img")
      .invoke("attr", "alt")
      .should("eq", newImageAltText);
    cy.closePropertyPane();
  });

  it("Property: defaultAnnotations", function() {
    // There is no any annotation for the first time
    cy.get(viewWidgetsPage.imageAnnotatorWidget + " img + div")
      .children()
      .should("have.length", 0);
    // Set default annotations
    const defaultAnnotations = [
      {
        geometry: {
          type: "RECTANGLE",
          x: 15.132557927662546,
          y: 21.022727272727273,
          width: 16.326034802150083,
          height: 21.022727272727273,
        },
        data: { text: "annotation01", id: 0.381974126691756 },
      },
    ];
    cy.get(viewWidgetsPage.imageAnnotatorDefaultAnnotations)
      .first()
      .focus({ force: true })
      .type("{ctrl}{shift}{end}")
      .clear()
      .type(JSON.stringify(defaultAnnotations), {
        parseSpecialCharSequences: false,
      });
    // Assert
    cy.get(viewWidgetsPage.imageAnnotatorWidget + " img + div")
      .children()
      .should("have.length", 1);

    cy.closePropertyPane();
  });

  it("Property: isDisabled", function() {
    // Cleanup defaultAnnotations
    cy.get(viewWidgetsPage.imageAnnotatorDefaultAnnotations)
      .first()
      .focus({ force: true })
      .type("{ctrl}{shift}{end}")
      .clear();
    // Activate isDisabled from the property pane
    cy.togglebar(commonlocators.disableCheckbox);
    // Drag & drop on the image to be annotated
    const targetImageSelector = viewWidgetsPage.imageAnnotatorWidget;
    cy.annotateImage(targetImageSelector, { x: 10, y: 10 });
    // There is no any annotation created
    cy.get(viewWidgetsPage.imageAnnotatorWidget + " img + div")
      .children()
      .should("have.length", 0);
    // Cleanup
    cy.togglebarDisable(commonlocators.disableCheckbox);

    cy.closePropertyPane();
  });

  it("Property: selector", function() {
    // Open dropdown for selector property
    const targetPropertySelector = viewWidgetsPage.imageAnnotatorSelector;
    cy.get(targetPropertySelector)
      .eq(1)
      .click({ force: true });
    // Select a type, OVAL
    cy.get(".bp3-popover-content .t--dropdown-option .cs-text")
      .contains("Oval")
      .click({ force: true });
    // Drag & drop on the image to be annotated
    const targetImageSelector = viewWidgetsPage.imageAnnotatorWidget;
    cy.annotateImage(targetImageSelector, { x: 10, y: 10 });
    // Assert: The newly created annotation should be oval
    cy.get(viewWidgetsPage.imageAnnotatorWidget + " img + div")
      .children()
      .should("have.length", 1)
      .first()
      .should("have.css", "border-radius")
      .and("eq", "100%");

    cy.closePropertyPane();
  });
});
