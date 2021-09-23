describe("Active Datasource list", function() {
  it("SAAS plugin should display number of queries", function() {
    cy.get(".t--queries-for-SAAS").each((el) => {
      el.invoke("text").should("match", "/on this page/");
    });
  });
});
