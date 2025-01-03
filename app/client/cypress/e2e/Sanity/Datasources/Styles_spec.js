import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

let dsName;
describe(
  "Validate Datasource Panel Styles",
  {
    tags: [
      "@tag.Datasource",
      "@tag.Sanity",
      "@tag.excludeForAirgap",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  function () {
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
      cy.datasourceIconWrapperStyle("[data-testid=database-datasource-image]");
      //Name
      cy.datasourceNameStyle(".t--plugin-name");
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
      cy.datasourceNameStyle(".t--createBlankApiCard .t--plugin-name");
    });

    after(() => {
      dataSources.DeleteDatasourceFromWithinDS(dsName);
      //entityExplorer.ActionContextMenuByEntityName(dsName, "Delete");//Since Users is not appearing in EntityExplorer, this has potential to fail
    });
  },
);
