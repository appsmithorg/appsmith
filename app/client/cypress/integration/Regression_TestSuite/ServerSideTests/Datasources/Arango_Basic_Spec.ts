import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("Validate Arango DS", () => {
  before("Create a new Arango DS", () => {
    _.dataSources.CreateDataSource("Arango");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });
  it("1. ", () => {});
});
