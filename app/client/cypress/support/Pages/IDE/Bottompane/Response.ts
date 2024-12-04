class Response {
  private ResponseTab = "//button[@data-testid='t--tab-RESPONSE_TAB']";

  public switchToResponseTab(): void {
    cy.xpath(this.ResponseTab).click({ force: true });
  }

  public getResponseTypeSelector(type: string): string {
    return `//div[@data-testid='t--response-tab-segmented-control']//span[text()='${type}']`;
  }

  public switchResponseType(type: string): void {
    this.switchToResponseTab();
    cy.xpath(this.getResponseTypeSelector(type)).click({ force: true });
  }

  // TODO: Implement this method when response UI is ready
  public validateRecordCount(count: number): void {}
}

export { Response };
