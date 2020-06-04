describe("Create and Delete App Functionality", function() {
  it("Delete App Functionality", function() {
    cy.log("appname: " + localStorage.getItem("AppName"));
    const appname = localStorage.getItem("AppName");
    cy.DeleteApp(appname);
    cy.wait("@deleteApplication");
    cy.get("@deleteApplication").should("have.property", "status", 200);
  });
});
