// Edit mode modal
export class Templates {
  public locators = {
    _forkApp: ".t--fork-template",
    _templateCard: "[data-cy='template-card']",
  };

  ForkTemplateByName(name: string) {
    cy.contains(this.locators._templateCard, name)
      .find(this.locators._forkApp)
      .click();
  }
}
