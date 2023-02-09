import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import formControls from "../../../../locators/FormControl.json";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

describe("Ensures evaluated popup is viewable when dynamic bindings are present and draggable", function() {
  it("shows evaluated pop up is visible and draggable", () => {
    dataSources.CreateDataSource("Mongo", true, true);

    dataSources.NavigateToActiveTab();

    cy.get("@dsName").then((datasourceName: any) => {
      dataSources.CreateQuery(datasourceName);
    });
    // ordinary strings should not open evaluated value popup
    agHelper.TypeDynamicInputValueNValidate(
      "listingAndReviews",
      formControls.mongoCollection,
    );

    // object strings should not open evaluated value popup
    agHelper.TypeDynamicInputValueNValidate(
      "{beds : {$lte: 2}}",
      formControls.mongoFindQuery,
    );
    agHelper.TypeDynamicInputValueNValidate(
      "{number_of_reviews: -1}",
      formControls.mongoFindSort,
    );

    // string with dynamic bindings should open popup
    agHelper.TypeDynamicInputValueNValidate(
      "{{'{house_rules: 1, description:1}'}}",
      formControls.mongoFindProjection,
      true,
      "{house_rules: 1, description:1}",
    );

    // drag evaluated value popup
    agHelper.FocusAndDragEvaluatedValuePopUp(
      {
        propFieldName: formControls.mongoFindProjection,
        directInput: true,
        inputFieldName: "",
      },
      800,
      800,
    );
  });
});
