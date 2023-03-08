import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import {
  ERROR_ACTION_EXECUTE_FAIL,
  createMessage,
} from "../../../../support/Objects/CommonErrorMessages";

const locator = ObjectsRegistry.CommonLocators,
  apiPage = ObjectsRegistry.ApiPage,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Binding Expressions should not be truncated in Url Query Param", function() {
  it("Bug 16683, When Api url has dynamic binding expressions, ensures the query params is not truncated", function() {
    const apiUrl = `https://echo.hoppscotch.io/v6/deployments?limit=4{{Math.random() > 0.5 ? '&param1=5' : '&param2=6'}}`;

    apiPage.CreateAndFillApi(apiUrl, "BindingExpressions");
    apiPage.ValidateQueryParams({
      key: "limit",
      value: "4{{Math.random() > 0.5 ? '&param1=5' : '&param2=6'}}",
    });
  });
});
