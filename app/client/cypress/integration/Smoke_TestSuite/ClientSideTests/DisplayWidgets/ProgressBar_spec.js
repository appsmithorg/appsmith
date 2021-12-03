const explorer = require("../../../../locators/explorerlocators.json");

describe("ProgressBar Widget Functionality", function() {
  it("Add new Progress Bar", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("progressbarwidget", { x: 300, y: 300 });
    cy.get(".t--progressbar-widget").should("exist");
  });

  it("Update Progress bar properties and validate", () => {
    // add progress value
    cy.testJsontext("progress", 30);
    // show result
    cy.get(".t--property-control-showresult .t--js-toggle").click({
      force: true,
    });
    cy.testJsontext("showresult", "true");

    cy.get(".t--progressbar-widget > div")
      .eq(0)
      .then(($els) => {
        // get Window reference from element
        const win = $els[0].ownerDocument.defaultView;
        // use getComputedStyle to read the pseudo selector
        const after = win.getComputedStyle($els[0], "after");
        // read the value of the `content` CSS property
        const contentValue = after.getPropertyValue("width");
        // the returned value will have double quotes around it, but this is correct
        expect(contentValue).to.eq("90.0156px"); // 30% to px
      });
    cy.get(".t--progressbar-widget > div")
      .eq(1)
      .should("have.text", "30%");
  });
});
