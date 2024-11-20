type ComparisonOperator = "eq" | "gt" | "gte" | "lt" | "lte";

interface ValidationParams {
  count: number;
  operator: ComparisonOperator;
}

class Response {
  public locators = {
    responseTab: "[data-testid='t--tab-RESPONSE_TAB']",
    responseDataContainer: "[data-testid='t--query-response-data-container']",
    responseTypeMenuTrigger: "[data-testid='t--query-response-type-trigger']",
    responseRecordCount: "[data-testid='t--query-response-record-count']",

    /** @deprecated */
    responseType(type: string): string {
      return `//div[@data-testid='t--response-tab-segmented-control']//span[text()='${type}']`;
    },

    responseTypeMenuItem(type: string) {
      return `[data-testid="t--query-response-type-menu-item"][data-value="${type}"]`;
    },
  };

  /** @deprecated: method will be deleted when segmented control in response pane is replaced */
  public getResponseTypeSelector = this.locators.responseType;

  /** @deprecated: method will be deleted when segmented control in response pane is replaced */
  public switchResponseType(type: string): void {
    this.switchToResponseTab();
    cy.xpath(this.locators.responseType(type)).click({ force: true });
  }

  public switchToResponseTab(): void {
    cy.get(this.locators.responseTab).click({ force: true });
  }

  public openResponseTypeMenu() {
    cy.get(this.locators.responseDataContainer).realHover();
    cy.get(this.locators.responseTypeMenuTrigger).click({ force: true });
  }

  public selectResponseResponseTypeFromMenu(type: string): void {
    this.switchToResponseTab();
    this.openResponseTypeMenu();
    cy.get(this.locators.responseTypeMenuItem(type)).realClick();
  }

  public closeResponseTypeMenu() {
    cy.get(this.locators.responseTypeMenuTrigger).realClick();
  }

  public validateRecordCount({ count, operator }: ValidationParams): void {
    cy.get(this.locators.responseRecordCount)
      .invoke("text")
      .then((text) => {
        const extractedCount = parseInt(text.match(/\d+/)?.[0] || "0", 10);

        switch (operator) {
          case "eq":
            if (extractedCount !== count) {
              throw new Error(
                `Expected count to equal ${count}, but got ${extractedCount}`,
              );
            }
            break;
          case "gt":
            if (extractedCount <= count) {
              throw new Error(
                `Expected count > ${count}, but got ${extractedCount}`,
              );
            }
            break;
          case "gte":
            if (extractedCount < count) {
              throw new Error(
                `Expected count >= ${count}, but got ${extractedCount}`,
              );
            }
            break;
          case "lt":
            if (extractedCount >= count) {
              throw new Error(
                `Expected count < ${count}, but got ${extractedCount}`,
              );
            }
            break;
          case "lte":
            if (extractedCount > count) {
              throw new Error(
                `Expected count <= ${count}, but got ${extractedCount}`,
              );
            }
            break;
          default:
            throw new Error(`Invalid comparison operator: ${operator}`);
        }
      });
  }
}

export { Response };
