import HomePage from "../../../../locators/HomePage";
const pages = require("../../../../locators/Pages.json");

describe("Validate Datasource Panel Styles", function() {
  const backgroundColorGray900 = "rgb(25, 25, 25)";
  const backgroundColorGray700 = "rgb(87, 87, 87)";
  const backgroundColorGray1 = "rgb(250, 250, 250)";
  const backgroundColorGray2 = "rgb(240, 240, 240)";

  before(() => {
    //Navigate to datasource pane
    cy.get(pages.addEntityAPI)
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.createMockDatasource("Users");
    cy.get(pages.integrationCreateNew).click();
  });

  it("1. Mock datasource card design", () => {
    cy.get(pages.integrationCreateNew).click();
    //Card container style
    cy.datasourceCardContainerStyle(".t--mock-datasource-list");
    //Datasource card
    cy.datasourceCardStyle(".t--mock-datasource");
    //Description
    cy.mockDatasourceDescriptionStyle(
      "[data-testid=mockdatasource-description]",
    );
    //mock datasource image
    cy.datasourceImageStyle("[data-testid=mock-datasource-image]");
    //header text
    cy.datasourceContentWrapperStyle(".t--datasource-name");
    //Icon wrapper
    cy.datasourceIconWrapperStyle("[data-testid=mock-datasource-icon-wrapper]");
    //Name wrapper
    cy.get("[data-testid=mock-datasource-name-wrapper]")
      .should("have.css", "display", "flex")
      .and("have.css", "flex-direction", "column");
    //Name
    cy.datasourceNameStyle("[data-testid=mockdatasource-name]");
  });

  it("2. Database datasource card design", () => {
    cy.get(pages.integrationCreateNew).click();
    //Card container style
    cy.datasourceCardContainerStyle(
      "[data-testid=database-datasource-card-container]",
    );
    //Datasource card
    cy.datasourceCardStyle("[data-testid=database-datasource-card]");
    //mock datasource image
    cy.datasourceImageStyle("[data-testid=database-datasource-image]");
    //header text
    cy.datasourceContentWrapperStyle(
      "[data-testid=database-datasource-content-wrapper]",
    );
    //Icon wrapper
    cy.datasourceIconWrapperStyle(
      "[data-testid=database-datasource-content-wrapper] .dataSourceImageWrapper",
    );
    //Name
    cy.datasourceNameStyle(
      "[data-testid=database-datasource-content-wrapper] .textBtn",
    );
  });

  it("3. New API datasource card design", () => {
    cy.get(pages.integrationCreateNew).click();
    //Card container style
    cy.datasourceCardContainerStyle(
      "[data-testid=newapi-datasource-card-container]",
    );
    //Datasource card
    cy.datasourceCardStyle(".t--createBlankApiCard");
    //Datasource image
    cy.datasourceImageStyle(".content-icon");
    //Header text
    cy.datasourceContentWrapperStyle(
      "[data-testid=newapi-datasource-content-wrapper]",
    );
    //Icon wrapper
    cy.datasourceIconWrapperStyle(".content-icon-wrapper");
    //Name
    cy.datasourceNameStyle(".t--createBlankApiCard .textBtn");
  });

  it("4. Datasource title font size", () => {
    cy.get(".t--integrationsHomePage").should("have.css", "font-size", "20px");
  });

  it("5. Action button icon placement", () => {
    //Navigate to Active tab
    cy.get(pages.integrationActiveTab).click({ force: true });
    //Icon should be placed left to the text.
    cy.get(".t--create-query .t--left-icon");
  });

  it("6. Datasource Active card styles", () => {
    //Active card wrapper
    cy.get(".t--datasource")
      .should("have.css", "padding", "15px")
      .and("have.css", "cursor", "pointer")
      .realHover()
      .should("have.css", "background-color", backgroundColorGray1);

    cy.get("[data-testid=active-datasource-image]")
      .should("have.css", "height", "18px")
      .and("have.css", "max-width", "100%");

    cy.get("[data-testid=active-datasource-icon-wrapper]")
      .should("have.css", "background-color", backgroundColorGray2)
      .and("have.css", "width", "34px")
      .and("have.css", "height", "34px")
      .and("have.css", "border-radius", "50%")
      .and("have.css", "display", "flex")
      .and("have.css", "align-items", "center");

    //Name
    cy.datasourceNameStyle("[data-testid=active-datasource-name]");

    //Queries
    cy.get("[data-testid=active-datasource-queries]")
      .should("have.css", "display", "flex")
      .and("have.css", "margin", "4px 0px");

    //Buttons wrapper
    cy.get(".t--datasource-name .action-wrapper")
      .should("have.css", "gap", "10px")
      .and("have.css", "display", "flex")
      .and("have.css", "align-items", "center");
  });

  it("7. Collapse component styles", () => {
    //Collapse wrapper
    cy.get("[data-testid=datasource-collapse-wrapper]")
      .should("have.css", "color", backgroundColorGray700)
      .and("have.css", "display", "flex")
      .and("have.css", "gap", "8px")
      .and("have.css", "align-items", "center");
    //Collapse icon
    cy.get("[data-testid=datasource-collapse-icon] svg")
      .invoke("attr", "data-icon")
      .should("eq", "arrow-right");
    cy.get("[data-testid=datasource-collapse-icon] svg")
      .invoke("attr", "fill")
      .should("eq", "#4B4848");
    cy.get("[data-testid=datasource-collapse-icon] svg")
      .invoke("attr", "width")
      .should("eq", "12");
  });

  after(() => {
    //Delete Datasource
    cy.get(".t--datasource-menu-option")
      .eq(0)
      .click();
    cy.get(".t--datasource-option-delete").click();
    cy.get(".t--datasource-option-delete").click();
    //Delete Application
    cy.get(HomePage.applicationName).click();
    cy.get(".t--application-edit-menu li")
      .contains("Delete Application")
      .click();
    cy.get(".t--application-edit-menu li")
      .contains("Are you sure?")
      .click();
  });
});
