
describe("Validating Mobile Views", function() {
    let phones = ["iphone-3", "iphone-4", "iphone-5", "iphone-6", "iphone-6+", "iphone-7",
                  "iphone-8", "iphone-x", "samsung-note9", "samsung-s10"]
    phones.forEach((phone) => {
        it(`${phone} port execution`, function() {
            cy.viewport(phone);
            cy.visit("https://appsmith-git-mobile-v1main-get-appsmith.vercel.app/app/untitled-application-109/page1-63b7e7d1d5c5dd3ca41fcbd0");
            cy.xpath("//span[text()='Form']").scrollIntoView().should("be.visible");
            cy.xpath("//label[text()='Label']").should("be.visible");
            cy.xpath("//input").eq(0).scrollIntoView().click({force: true}).type("Test 1");
            cy.xpath("//input").eq(2).scrollIntoView().click({force: true}).type("Test 3");
            cy.get("button:contains('Reset')").click({force: true});
            cy.xpath("//input").eq(0).scrollIntoView().should("be.empty");
            cy.xpath("//input").eq(2).scrollIntoView().should("be.empty");
        });
    })
});