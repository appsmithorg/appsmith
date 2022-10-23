const dsl = require("../../../../../fixtures/Table/ImageResizeDSL.json");

describe("Table Widget Image Resize feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Verify image size on selecting different Image Sizes", function() {
    cy.getTableV2DataSelector("1", "3").then((selector) => {
      cy.get(`${selector} img`).should("have.css", "height", "32px");
    });

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("image");
    cy.moveToStyleTab();

    cy.get(".t--button-tab-MEDIUM").click();
    cy.getTableV2DataSelector("1", "3").then((selector) => {
      cy.get(`${selector} img`).should("have.css", "height", "64px");
    });

    cy.get(".t--button-tab-LARGE").click();
    cy.getTableV2DataSelector("1", "3").then((selector) => {
      cy.get(`${selector} img`).should("have.css", "height", "128px");
    });

    cy.get(".t--button-tab-DEFAULT").click();
    cy.getTableV2DataSelector("1", "3").then((selector) => {
      cy.get(`${selector} img`).should("have.css", "height", "32px");
    });

    cy.closePropertyPane();
  });

  it("2. Verify image size with cell wrapping turned on", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("title");
    cy.moveToContentTab();
    cy.get(".t--property-control-cellwrapping .bp3-switch").click();
    cy.closePropertyPane();

    cy.getTableV2DataSelector("1", "3").then((selector) => {
      cy.get(`${selector} img`).should("have.css", "height", "32px");
    });

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("image");
    cy.moveToStyleTab();

    cy.get(".t--button-tab-MEDIUM").click();
    cy.getTableV2DataSelector("1", "3").then((selector) => {
      cy.get(`${selector} img`).should("have.css", "height", "64px");
    });

    cy.get(".t--button-tab-LARGE").click();
    cy.getTableV2DataSelector("1", "3").then((selector) => {
      cy.get(`${selector} img`).should("have.css", "height", "128px");
    });

    cy.get(".t--button-tab-DEFAULT").click();
    cy.getTableV2DataSelector("1", "3").then((selector) => {
      cy.get(`${selector} img`).should("have.css", "height", "32px");
    });

    cy.closePropertyPane();
  });
});
