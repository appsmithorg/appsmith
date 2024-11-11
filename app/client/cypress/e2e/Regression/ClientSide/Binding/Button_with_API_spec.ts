import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const testdata = require("../../../../fixtures/testdata.json");
import apiLocators from "../../../../locators/ApiEditor";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Bind a button and Api usecase",
  { tags: ["@tag.Binding"] },
  function () {
    let apiData;
    let valueToTest;
    before(() => {
      _.agHelper.AddDsl("buttonApiDsl");
    });

    it("1. Add an API by binding a button in its header", function () {
      _.apiPage.CreateAndFillApi(this.dataSet.userApi + "/mock-api?records=10");
      cy.get(apiwidget.headerKey)
        .first()
        .click({ force: true })
        .type("key", { parseSpecialCharSequences: true });
      cy.get(apiwidget.headerValue)
        .first()
        .click({ force: true })
        .type("{{Button1.text", { parseSpecialCharSequences: true });
      cy.RunAPI();
      cy.get(apiLocators.jsonResponseTab).click();
      cy.get(apiLocators.responseBody)
        .contains("name")
        .siblings("span")
        .invoke("text")
        .then((text) => {
          valueToTest = `${text
            .match(/"(.*)"/)[0]
            .split('"')
            .join("")}`;
          cy.log(valueToTest);
          apiData = valueToTest;
          cy.log("val1:" + valueToTest);
        });
    });

    it("2. Button-Name updation & API datasource binding with button name validation", function () {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      //changing the Button Name
      _.propPane.RenameWidget("Button1", testdata.buttonName);

      //API datasource binding with button name validation
      EditorNavigation.SelectEntityByName("Api1", EntityType.Api);
      cy.get(apiwidget.headerValue)
        .first()
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.contains(testdata.buttonName);
        });
    });
  },
);
