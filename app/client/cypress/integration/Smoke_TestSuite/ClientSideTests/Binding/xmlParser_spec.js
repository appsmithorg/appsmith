const dsl = require("../../../../fixtures/xmlParser.json");
const publish = require("../../../../locators/publishWidgetspage.json");

describe("xml2json text", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("publish widget and validate the data displayed in text widget from xmlParser function", function() {
    cy.PublishtheApp();
    cy.get(publish.textWidget)
      .first()
      .should(
        "have.text",
        `{  "note": {    "to": "Tove",    "from": "Jani",    "heading": "Reminder",    "body": "Don't forget me this weekend!"  }}`,
      );
  });
});
