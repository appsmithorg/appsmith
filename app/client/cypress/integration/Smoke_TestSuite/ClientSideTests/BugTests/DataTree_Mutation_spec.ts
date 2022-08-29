import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage,
  JSEditor: jsEditor
} = ObjectsRegistry;

const jsObjectBody = `export default {
	mutateValue: function (){
    const response = Api1.data
    response.users[0].name = "__" + response.users[0].name
		return response.users[0].name
	},
}`;

describe("Data mutation tests", () => {
  it("1. #14699 Mutate Api response and verify it doesn't use previous mutated values", () => {
    ApiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    ApiPage.RunAPI();

    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    // verify that response string has __ in the start
    agHelper.GetNClick(jsEditor._runButton);
    agHelper.AssertContains("mutateValue ran successfully");
    agHelper.AssertContains(/^__[a-zA-Z]+/, "exist");

    agHelper.WaitUntilAllToastsDisappear();

    // verify that response string has __ in the start and not more "__" got appended during 2nd run
    agHelper.GetNClick(jsEditor._runButton);
    agHelper.ValidateToastMessage("mutateValue ran successfully");
    agHelper.AssertContains(/^__[a-zA-Z]+/, "exist");
  });
});
