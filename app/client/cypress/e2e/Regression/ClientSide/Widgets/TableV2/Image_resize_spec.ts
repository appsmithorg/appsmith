import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget Image Resize feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("Table/ImageResizeDSL");
    });

    it("1. Verify image size on selecting different Image Sizes", function () {
      cy.getTableV2DataSelector("1", "3").then((selector) => {
        cy.get(`${selector} img`).should("have.css", "height", "32px");
      });

      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("image");
      cy.moveToStyleTab();

      cy.get("[data-value='MEDIUM']").click();
      cy.getTableV2DataSelector("1", "3").then((selector) => {
        cy.get(`${selector} img`).should("have.css", "height", "64px");
      });

      cy.get("[data-value='LARGE']").click();
      cy.getTableV2DataSelector("1", "3").then((selector) => {
        cy.get(`${selector} img`).should("have.css", "height", "128px");
      });

      cy.get("[data-value='DEFAULT']").click();
      cy.getTableV2DataSelector("1", "3").then((selector) => {
        cy.get(`${selector} img`).should("have.css", "height", "32px");
      });

      cy.closePropertyPane();
    });

    it("2. Verify image size with cell wrapping turned on", function () {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("title");
      cy.moveToContentTab();
      cy.get(".t--property-control-cellwrapping input").click();
      cy.closePropertyPane();

      cy.getTableV2DataSelector("1", "3").then((selector) => {
        cy.get(`${selector} img`).should("have.css", "height", "32px");
      });

      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("image");
      cy.moveToStyleTab();

      cy.get("[data-value='MEDIUM']").click();
      cy.getTableV2DataSelector("1", "3").then((selector) => {
        cy.get(`${selector} img`).should("have.css", "height", "64px");
      });

      cy.get("[data-value='LARGE']").click();
      cy.getTableV2DataSelector("1", "3").then((selector) => {
        cy.get(`${selector} img`).should("have.css", "height", "128px");
      });

      cy.get("[data-value='DEFAULT']").click();
      cy.getTableV2DataSelector("1", "3").then((selector) => {
        cy.get(`${selector} img`).should("have.css", "height", "32px");
      });

      cy.closePropertyPane();
    });
  },
);
