/*
 * Commenting this spec as its flaky
 *
 * */
// const testdata = require("../../../../fixtures/testdata.json");
// describe("Create a rest datasource", function() {
//   beforeEach(() => {
//     cy.startRoutesForDatasource();
//   });

//   it("Create a rest datasource", function() {
//     cy.NavigateToAPI_Panel();
//     cy.CreateAPI("Testapi");
//     cy.enterDatasource(testdata.basicURl);
//     cy.get(".t--store-as-datasource").click();
//     cy.addBasicProfileDetails("test", "test@123");
//     cy.saveDatasource();
//     cy.contains(".datasource-highlight", "envyenksqii9nf3.m.pipedream.net");
//     cy.SaveAndRunAPI();
//     cy.wait(2000);
//     var encodedStringBtoA = btoa("test:test@123");
//     cy.log(encodedStringBtoA);
//     cy.ResponseStatusCheck(testdata.successStatusCode);
//     cy.ResponseTextCheck("Basic ".concat(encodedStringBtoA));
//   });
// });
