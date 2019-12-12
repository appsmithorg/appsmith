describe("My First Test", function() {
  it("Visits the Kitchen Sink", function() {
    cy.visit(
      "http://localhost:3000/applications/5d807e45795dc6000482bc74/pages/5df08f966ccd2400049dde1a/edit",
    );
    // cy.contains("Enter your Netlify Site URL");
    // cy.get();
    // Main button pressed (usually the left button)
    // cy.get(".TABLE_WIDGET")
    //   .first()
    //   .trigger("mousedown")
    //   .trigger("mousemove", { which: 1, clientX: 400, clientY: 100 })
    //   .trigger("mouseup");

    // cy.contains("Submit").click();
    // cy.contains("Barbra", { timeout: 1000000 }).click();
    // // cy.contains("{{fetchUsers2}}");
    // cy.get('input[value="{{fetchUsers2}}"]')
    //   // .first()
    //   .clear()
    //   .type(
    //     "{{}{{}fetchUsers2.map(user => {{}return {{}'name': user.name}})}}",
    //     {
    //       force: true,
    //     },
    //   );

    // .then(function($input) {
    //   $input[0].setAttribute(
    //     "value",
    //     "{{fetchUsers2.map(user => {return {'name': user.name}})}}",
    //   );
    // });

    // .invoke(
    //   "attr",
    //   "value",
    //   "{{fetchUsers2.map(user => {return {'name': user.name}})}}",
    // );

    expect(true).to.eq(true);
  });
});
