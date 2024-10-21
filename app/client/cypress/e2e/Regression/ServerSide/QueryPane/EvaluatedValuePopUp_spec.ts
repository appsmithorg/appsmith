import * as _ from "../../../../support/Objects/ObjectsCore";
import formControls from "../../../../locators/FormControl.json";

describe(
  "Ensures evaluated popup is viewable when dynamic bindings are present and draggable",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("shows evaluated pop up is visible and draggable", () => {
      _.dataSources.CreateDataSource("Mongo", true, true);
      _.dataSources.CreateQueryAfterDSSaved();
      // ordinary strings should not open evaluated value popup
      _.assertHelper.AssertNetworkStatus("@trigger");

      _.dataSources.ValidateNSelectDropdown(
        "Collection",
        "",
        "listingAndReviews",
      );

      // object strings should not open evaluated value popup
      _.agHelper.TypeDynamicInputValueNValidate(
        "{beds : {$lte: 2}}",
        formControls.mongoFindQuery,
      );
      _.agHelper.TypeDynamicInputValueNValidate(
        "{number_of_reviews: -1}",
        formControls.mongoFindSort,
      );

      // string with dynamic bindings should open popup
      _.agHelper.TypeDynamicInputValueNValidate(
        "{{'{house_rules: 1, description:1}'}}",
        formControls.mongoFindProjection,
        true,
        "{house_rules: 1, description:1}",
      );

      // drag evaluated value popup
      _.agHelper.FocusAndDragEvaluatedValuePopUp(
        {
          propFieldName: formControls.mongoFindProjection,
          directInput: true,
          inputFieldName: "",
        },
        800,
        800,
      );
    });
  },
);
