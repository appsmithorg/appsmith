import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import {
  ERROR_ACTION_EXECUTE_FAIL,
  createMessage,
} from "../../../../support/Objects/CommonErrorMessages";

const locator = ObjectsRegistry.CommonLocators,
  apiPage = ObjectsRegistry.ApiPage,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Binding Expressions should not be truncated in Url and path extraction", function () {
  it("Bug 16377, When Api url has dynamic binding expressions, ensure the url and path derived is not corrupting Api execution", function () {
    //Since the specified expression always returns true - it will never run mock-apis - which actually doesn't exist
    const apiUrl = `http://host.docker.internal:5001/v1/{{true ? 'mock-api' : 'mock-apis'}}?records=10`;

    apiPage.CreateAndFillApi(apiUrl, "BindingExpressions");
    apiPage.RunAPI();
    agHelper.AssertElementAbsence(
      locator._specificToast(
        createMessage(ERROR_ACTION_EXECUTE_FAIL, "BindingExpressions"),
      ),
    ); //Assert that an error is not returned.
    apiPage.ResponseStatusCheck("200 OK");
  });
});
