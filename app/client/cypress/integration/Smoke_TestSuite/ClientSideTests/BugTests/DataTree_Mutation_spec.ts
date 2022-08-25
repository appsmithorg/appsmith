import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage,
  JSEditor: jsEditor,
} = ObjectsRegistry;

const jsObjectBody = `export default {
	mutateValue: async function (){
    const response = await Api1.run()
    response.users[0].name = "__" + response.users[0].name
		return response.users[0].name
	},
}`;

describe("Data mutation tests", () => {
  it("1. #14699 Mutate Api response and verify it doesn't use previous mutated values", () => {
    ApiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");

    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    agHelper.GetNClick(jsEditor._runButton);

    // verify that response string has __ in the start
    agHelper.ValidateToastMessage("mutateValue ran successfully");
    cy.contains(/^__[a-zA-Z]+/).should("exist");

    // verify that response string has __ in the start and not more "__" got appended
    agHelper.ValidateToastMessage("mutateValue ran successfully");
    cy.contains(/^__[a-zA-Z]+/).should("exist");
  });
});
