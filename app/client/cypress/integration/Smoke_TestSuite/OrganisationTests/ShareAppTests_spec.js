// /// <reference types="Cypress" />
//
// const homePage = require("../../../locators/HomePage.json");
// const publish = require("../../../locators/publishWidgetspage.json");
//
// describe("Create new org and share with a user", function() {
//   let orgid;
//   let appid;
//   let currentUrl;
//
//   it("create org and then share with a user from Application share option within application", function() {
//     cy.NavigateToHome();
//     cy.generateUUID().then(uid => {
//       orgid = uid;
//       appid = uid;
//       localStorage.setItem("OrgName", orgid);
//       cy.createOrg(orgid);
//       cy.CreateAppForOrg(orgid, appid);
//       cy.wait("@getPagesForApp").should(
//         "have.nested.property",
//         "response.body.responseMeta.status",
//         200,
//       );
//       cy.get("h2").contains("Drag and drop a widget here");
//       cy.get(homePage.shareApp).click();
//       cy.shareApp(Cypress.env("TESTUSERNAME1"), homePage.viewerRole);
//     });
//     cy.LogOut();
//   });
//
//   it("login as invited user and then validate viewer privilage", function() {
//     cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
//     cy.get(homePage.searchInput).type(appid);
//     cy.wait(2000);
//     cy.get(homePage.appsContainer).contains(orgid);
//     cy.xpath(homePage.ShareBtn).should("not.exist");
//     cy.get(homePage.applicationCard).trigger("mouseover");
//     cy.get(homePage.appEditIcon).should("not.exist");
//     cy.launchApp(appid);
//     cy.LogOut();
//   });
//
//   it("Enable public access to Application", function() {
//     cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
//     cy.visit("/applications");
//     cy.wait("@applications").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.SearchApp(appid);
//     cy.wait("@getPagesForApp").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.get("h2").contains("Drag and drop a widget here");
//     cy.get(homePage.shareApp).click();
//     cy.enablePublicAccess();
//     cy.PublishtheApp();
//     currentUrl = cy.url();
//     cy.url().then(url => {
//       currentUrl = url;
//       cy.log(currentUrl);
//     });
//     cy.get(publish.backToEditor).click();
//     cy.LogOut();
//   });
//
//   it("login as uninvited user and then validate public access of Application", function() {
//     cy.LogintoApp(Cypress.env("TESTUSERNAME2"), Cypress.env("TESTPASSWORD2"));
//     cy.visit(currentUrl);
//     cy.wait("@getPagesForApp").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.get(publish.pageInfo)
//       .invoke("text")
//       .then(text => {
//         const someText = text;
//         expect(someText).to.equal("This page seems to be blank");
//       });
//     cy.LogOut();
//   });
//   it("login as Owner and disable public access", function() {
//     cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
//     cy.visit("/applications");
//     cy.wait("@applications").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.SearchApp(appid);
//     cy.wait("@getPagesForApp").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.get("h2").contains("Drag and drop a widget here");
//     cy.get(homePage.shareApp).click();
//     cy.enablePublicAccess();
//     cy.LogOut();
//   });
//
//   it("login as uninvited user and then validate public access disable feature", function() {
//     cy.LogintoApp(Cypress.env("TESTUSERNAME2"), Cypress.env("TESTPASSWORD2"));
//     cy.visit(currentUrl);
//     cy.wait("@getPagesForApp").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       404,
//     );
//     cy.LogOut();
//   });
//
//   it("login as owner and delete App ", function() {
//     cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
//     cy.visit("/applications");
//     cy.wait("@applications").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.SearchApp(appid);
//     cy.get("#loading").should("not.exist");
//   });
// });
