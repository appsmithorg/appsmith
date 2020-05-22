describe("Create and Delete Page Functionality", function() {
  it("Delete Page Functionality", function() {
    cy.log("PageName: " + localStorage.getItem("PageName"));
    const PageName = localStorage.getItem("PageName");
    cy.Deletepage(PageName);
    cy.wait("@deletePage");
    cy.get("@deletePage").should("have.property", "status", 200);
  });
});
