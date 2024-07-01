import { agHelper } from "../../../../support/Objects/ObjectsCore";

describe(
  "Auto height default widget content alignment",
  { tags: ["@tag.AutoHeight"] },
  () => {
    before(() => {
      agHelper.AddDsl("autoHeightContentAlignmentDSL");
    });

    it("1. Should have contents centered using align-items css", () => {
      cy.get("[data-testid='t--centered-Text1-x2dmaguw7a']").should(
        "have.css",
        "align-items",
        "center",
      );
      cy.get("[data-testid='t--centered-Checkbox1-sio6hr58nk']").should(
        "have.css",
        "align-items",
        "center",
      );
      cy.get("[data-testid='t--centered-Switch1-4vy4pjyjat']").should(
        "have.css",
        "align-items",
        "center",
      );
      cy.get("[data-testid='t--centered-Text2-1k6r0gx5sd']").should(
        "have.css",
        "align-items",
        "flex-start",
      );
    });
  },
);
