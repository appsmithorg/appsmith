import * as _ from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

import {
  ERROR_ACTION_EXECUTE_FAIL,
  createMessage,
} from "../../../../support/Objects/CommonErrorMessages";

describe("API Bugs", function () {
  it("1. Bug 14037: User gets an error even when table widget is added from the API page successfully", function () {
    _.apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users", "Api1");
    _.apiPage.RunAPI();

    _.dataSources.AddSuggesstedWidget(Widgets.Table);

    _.debuggerHelper.AssertErrorCount(0);
  });

  it("2. Bug 16377, When Api url has dynamic binding expressions, ensure the url and path derived is not corrupting Api execution", function () {
    //Since the specified expression always returns true - it will never run mock-apis - which actually doesn't exist
    const apiUrl = `http://host.docker.internal:5001/v1/{{true ? 'mock-api' : 'mock-apis'}}?records=10`;

    _.apiPage.CreateAndFillApi(apiUrl, "BindingExpressions");
    _.apiPage.RunAPI();
    _.agHelper.AssertElementAbsence(
      _.locators._specificToast(
        createMessage(ERROR_ACTION_EXECUTE_FAIL, "BindingExpressions"),
      ),
    ); //Assert that an error is not returned.
    _.apiPage.ResponseStatusCheck("200 OK");
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("3. Bug 18876 Ensures application does not crash when saving datasource", () => {
    _.apiPage.CreateAndFillApi(
      "https://www.jsonplaceholder.com",
      "FirstAPI",
      10000,
      "POST",
    );
    _.apiPage.SelectPaneTab("Authentication");
    cy.get(_.apiPage._saveAsDS).last().click({ force: true });
    cy.get(".t--close-editor").click({ force: true });
    cy.get(_.dataSources._datasourceModalSave).click();
    // ensures app does not crash and datasource is saved.
    cy.contains("Edit Datasource to access authentication settings").should(
      "exist",
    );
  });

  it("4. Bug 16683, When Api url has dynamic binding expressions, ensures the query params is not truncated", function () {
    const apiUrl = `https://echo.hoppscotch.io/v6/deployments?limit=4{{Math.random() > 0.5 ? '&param1=5' : '&param2=6'}}`;

    _.apiPage.CreateAndFillApi(apiUrl, "BindingExpressions");
    _.apiPage.ValidateQueryParams({
      key: "limit",
      value: "4{{Math.random() > 0.5 ? '&param1=5' : '&param2=6'}}",
    });
  });
});
