import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

let dsName;
describe("excludeForAirgap", "Validate Datasource Panel Styles", function () {
  const backgroundColorGray700 = "rgb(76, 86, 100)";
  const backgroundColorGray1 = "rgb(241, 245, 249)";
  const backgroundColorGray2 = "rgba(0, 0, 0, 0)";

  before("Creating mock db for test case 4 validations", () => {
    dataSources.CreateMockDB("Users").then((mockDBName) => {
      dsName = mockDBName;
    });
  });

  it("1. Mock datasource card design", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.Sleep(200);
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
    //Name wrapper
    cy.get("[data-testid=mock-datasource-name-wrapper]")
      .should("have.css", "display", "flex")
      .and("have.css", "flex-direction", "column");
    //Name
    cy.datasourceNameStyle("[data-testid=mockdatasource-name]");
  });

  it("2. Database datasource card design", () => {
    dataSources.NavigateToDSCreateNew();
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
      "[data-testid=database-datasource-content-wrapper] .dataSourceImage",
    );
    //Name
    cy.datasourceNameStyle(
      "[data-testid=database-datasource-content-wrapper] .textBtn",
    );
  });

  it("3. New API datasource card design", () => {
    dataSources.NavigateToDSCreateNew();
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
    cy.datasourceIconWrapperStyle(".content-icon");
    //Name
    cy.datasourceNameStyle(".t--createBlankApiCard .textBtn");
    //Datsource title font size should be 20px
    cy.get(".sectionHeadings").should("have.css", "font-size", "20px");
  });

  it("4. Datasource Active card styles", () => {
    // Action button icon placement
    dataSources.NavigateToActiveTab();
    //Icon should be placed left to the text.
    cy.get(".t--create-query span");

    //Active card wrapper
    cy.get(".t--datasource")
      .should("have.css", "padding", "15px")
      .and("have.css", "cursor", "pointer")
      .realHover()
      .should("have.css", "background-color", backgroundColorGray1);

    cy.get("[data-testid=active-datasource-image]")
      .should("have.css", "height", "34px")
      .and("have.css", "max-width", "100%");

    cy.get("[data-testid=active-datasource-icon-wrapper]")
      .should("have.css", "background-color", backgroundColorGray2)
      .and("have.css", "width", "34px")
      .and("have.css", "height", "34px")
      .and("have.css", "border-radius", "0px")
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

  it("5. Collapse component styles", () => {
    //Collapse wrapper
    cy.get("[data-testid=datasource-collapse-wrapper]")
      .should("have.css", "color", backgroundColorGray700)
      .and("have.css", "display", "flex")
      .and("have.css", "gap", "8px")
      .and("have.css", "align-items", "center");
    //Collapse icon
    cy.get("[data-testid=datasource-collapse-wrapper] span")
      .invoke("attr", "data-testid")
      .should("eq", "datasource-collapse-icon");
    cy.get(
      "[data-testid=datasource-collapse-wrapper] span[data-testid='datasource-collapse-icon'] svg",
    )
      .invoke("attr", "fill")
      .should("eq", "currentColor")
      .then(($element) => {
        const attributes = $element[0].attributes;
        cy.log(attributes);
      });
    // .invoke("attr", "width")
    // .should("eq", "12");
  });

  after(() => {
    dataSources.DeleteDatasouceFromActiveTab(dsName);
    //entityExplorer.ActionContextMenuByEntityName(dsName, "Delete");//Since Users is not appearing in EntityExplorer, this has potential to fail
  });
});
