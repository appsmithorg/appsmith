import * as _ from "../../../../support/Objects/ObjectsCore";
import formControls from "../../../../locators/FormControl.json";

describe("Mongo Form to Native conversion works", () => {
  it("Form to Native conversion works.", () => {
    const expectedOutput = `{\n  \"find\": \"listingAndReviews\",\n  \"filter\": {beds : {$lte: 2}},\n  \"sort\": {number_of_reviews: -1},\n  \"limit\": 10,\n  \"batchSize\": 10\n}\n`;

    _.dataSources.CreateDataSource("Mongo", true, true);
    _.dataSources.CreateQueryAfterDSSaved();
    _.agHelper.TypeDynamicInputValueNValidate(
      "listingAndReviews",
      formControls.mongoCollection,
    );

    _.agHelper.TypeDynamicInputValueNValidate(
      "{beds : {$lte: 2}}",
      formControls.mongoFindQuery,
    );

    _.agHelper.TypeDynamicInputValueNValidate(
      "{number_of_reviews: -1}",
      formControls.mongoFindSort,
    );

    _.agHelper.TypeDynamicInputValueNValidate(
      "{house_rules: 1, description:1}",
      formControls.mongoFindProjection,
    );

    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find Document(s)",
      "Raw",
    );

    _.agHelper.VerifyCodeInputValue(formControls.rawBody, expectedOutput);

    // then we test to check if the conversion is only done once.
    // and then we ensure that upon switching between another command and Raw, the Template menu does not show up.

    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Raw",
      "Find Document(s)",
    );

    _.agHelper.TypeDynamicInputValueNValidate(
      "modifyCollection",
      formControls.mongoCollection,
    );

    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find Document(s)",
      "Raw",
    );

    // make sure template menu no longer reappears
    _.agHelper.AssertElementAbsence(_.dataSources._templateMenu);

    // verify value has not changed
    _.agHelper.VerifyCodeInputValue(formControls.rawBody, expectedOutput);
  });
});
