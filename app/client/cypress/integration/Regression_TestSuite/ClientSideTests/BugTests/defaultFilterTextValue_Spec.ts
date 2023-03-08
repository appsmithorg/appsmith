import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;

describe("Select widget filterText", () => {
  before(() => {
    cy.fixture("defaultFilterText").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("default value should be an empty string", () => {
    agHelper.AssertContains("string");
  });
});
