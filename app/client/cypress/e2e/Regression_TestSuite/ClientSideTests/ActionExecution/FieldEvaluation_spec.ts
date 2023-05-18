import * as _ from "../../../../support/Objects/ObjectsCore";

const { agHelper, entityExplorer, propPane } = _;

describe("Field value evaluation", () => {
  before(() => {
    cy.fixture("buttondsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("Button1", "Widgets");
  });

  it("1. Evaluation works for fields", () => {
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "{{Button1.text}}",
    );

    agHelper.VerifyEvaluatedValue("Submit");
  });
});
