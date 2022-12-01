import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import formControls from "../../../../locators/FormControl.json";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

describe("Mongo Form to Native conversion works", () => {
  beforeEach(() => {
    dataSources.StartDataSourceRoutes();
  });

  it("Form to Native conversion works.", () => {
    const expectedOutput = `{\n  \"find\": \"listingAndReviews\",\n  \"filter\": {beds : {$lte: 2}},\n  \"sort\": {number_of_reviews: -1},\n  \"limit\": 10,\n  \"batchSize\": 10\n}\n`;

    dataSources.CreateDataSource("Mongo", true, true);

    dataSources.NavigateToActiveTab();

    cy.get("@dsName").then((datasourceName: any) => {
      dataSources.CreateQuery(datasourceName);
    });
    agHelper.TypeDynamicInputValueNValidate(
      "listingAndReviews",
      formControls.mongoCollection,
    );

    agHelper.TypeDynamicInputValueNValidate(
      "{beds : {$lte: 2}}",
      formControls.mongoFindQuery,
    );

    agHelper.TypeDynamicInputValueNValidate(
      "{number_of_reviews: -1}",
      formControls.mongoFindSort,
    );

    agHelper.TypeDynamicInputValueNValidate(
      "{house_rules: 1, description:1}",
      formControls.mongoFindProjection,
    );

    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)", "Raw");

    agHelper.VerifyCodeInputValue(formControls.rawBody, expectedOutput);

    // then we test to check if the conversion is only done once.
    // and then we ensure that upon switching between another command and Raw, the Template menu does not show up.

    dataSources.ValidateNSelectDropdown("Commands", "Raw", "Find Document(s)");

    agHelper.TypeDynamicInputValueNValidate(
      "modifyCollection",
      formControls.mongoCollection,
    );

    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)", "Raw");

    // make sure template menu no longer reappears
    agHelper.AssertElementAbsence(dataSources._templateMenu);

    // verify value has not changed
    agHelper.VerifyCodeInputValue(formControls.rawBody, expectedOutput);
  });
});
