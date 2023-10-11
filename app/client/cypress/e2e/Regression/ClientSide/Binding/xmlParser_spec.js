const publish = require("../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("xml2json text", function () {
  before(() => {
    _.agHelper.AddDsl("xmlParser");
  });
  it("1. Publish widget and validate the data displayed in text widget from xmlParser function", function () {
    _.deployMode.DeployApp();
    cy.get(publish.textWidget)
      .first()
      .should(
        "have.text",
        `{  "note": {    "to": "Tove",    "from": "Jani",    "heading": "Reminder",    "body": "Don't forget me this weekend!"  }}`,
      );
  });
});
