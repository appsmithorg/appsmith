import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper } = ObjectsRegistry;

describe("Auto height default widget content alignment", () => {
  before(() => {
    cy.fixture("autoHeightContentAlignmentDSL").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
  });

  it("1. Should have contents centered using align-items css", () => {
    cy.get("[data-cy='t--centered-Text1-x2dmaguw7a']").should(
      "have.css",
      "align-items",
      "center",
    );
    cy.get("[data-cy='t--centered-Checkbox1-sio6hr58nk']").should(
      "have.css",
      "align-items",
      "center",
    );
    cy.get("[data-cy='t--centered-Switch1-4vy4pjyjat']").should(
      "have.css",
      "align-items",
      "center",
    );
    cy.get("[data-cy='t--centered-Text2-1k6r0gx5sd']").should(
      "have.css",
      "align-items",
      "flex-start",
    );
  });
});
