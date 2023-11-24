import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const publish = require("../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("xml2json text", { tags: ["@tag.Binding"] }, function () {
  before(() => {
    _.homePage.NavigateToHome();
    _.homePage.ImportApp("xmlParser.json");
    _.homePage.AssertImportToast();
  });

  it("1. Check if XMLparser v3 autocomplete works", function () {
    EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
    _.propPane.TypeTextIntoField("Text", "{{xmlParser.j", true);
    _.agHelper.GetNAssertElementText(_.locators._hints, "j2xParser");

    _.propPane.TypeTextIntoField("Text", "{{new xmlParser.j2xParser().p", true);
    _.agHelper.GetNAssertElementText(_.locators._hints, "parse");
  });

  it("2. Publish widget and validate the data displayed in text widget from xmlParser function", function () {
    _.deployMode.DeployApp();
    cy.get(publish.textWidget)
      .first()
      .should(
        "have.text",
        `{  "note": {    "to": "Tove",    "from": "Jani",    "heading": "Reminder",    "body": "Don't forget me this weekend!"  }}`,
      );
  });
});
