const dsl = require("../../../../fixtures/alignmentWithDynamicHeightDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation", function () {
    it("Validate change with auto height width for text widgets", function () {
        cy.addDsl(dsl);
        cy.wait(30000); //for dsl to settled
        
    });

});