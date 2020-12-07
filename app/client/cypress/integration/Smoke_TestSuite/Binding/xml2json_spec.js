const dsl = require("../../../fixtures/xml2json.json");
const publish = require("../../../locators/publishWidgetspage.json");

describe("xml2json text", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("publish widget and validate the data displayed in text widget from xml2json function", function() {
    cy.PublishtheApp();
    cy.get(publish.textWidget)
      .first()
      .should(
        "have.text",
        '{"_declaration":{"_attributes":{"version":"1.0","encoding":"utf-8"}},"note":{"_attributes":{"importance":"high","logged":"true"},"title":{"_text":"Happy"},"todo":[{"_text":"Work"},{"_text":"Play"}]}}',
      );
  });
});
