describe("Terms-And-Conditions", () => {
    it("1. Should check the color of titles is #202939", () => {
        cy.visit("terms-and-conditions.html");
        cy.wait(1000);
        cy.get("h1, h2, h3, h4, h5, h6").each(($el) => {
            cy.wrap($el).should("have.css", "color", "rgb(32, 41, 57)");
        });
    });
});