import { ObjectsRegistry } from "../Objects/Registry";

type FixedConversionOptions = "DESKTOP" | "MOBILE";

type Alignments = "START" | "CENTER" | "END";

const alignmentIndex = {
  START: 0,
  CENTER: 1,
  END: 2,
};

export class AutoLayout {
  private autoConvertButton = "#t--layout-conversion-cta";

  private useSnapshotBannerButton = "span:contains('Use snapshot')";
  private discardSnapshotBannerButton = "span:contains('Discard snapshot')";

  private convertDialogButton = "button:contains('Convert layout')";
  private refreshAppDialogButton = "button:contains('Refresh the app')";
  private useSnapshotDialogButton = "button:contains('Use snapshot')";
  private convertAnywaysDialogButton = "button:contains('Convert anyways')";
  private discardDialogButton = "button:contains('Discard')";

  private fixedModeConversionOptionButton = (option: FixedConversionOptions) =>
    `//span[@data-value = '${option}']`;

  private flexMainContainer = ".flex-container-0";

  public convertToAutoLayoutAndVerify(isNotNewApp = true) {
    this.verifyIsFixedLayout();

    cy.get(this.autoConvertButton).contains("Auto").click({
      force: true,
    });
    cy.get(this.convertDialogButton).click({
      force: true,
    });

    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    if (isNotNewApp) {
      cy.wait("@snapshotSuccess").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
    }

    cy.get(this.refreshAppDialogButton).click({
      force: true,
    });
    cy.wait(2000);

    this.verifyIsAutoLayout();
  }

  public convertToFixedLayoutAndVerify(
    fixedConversionOption: FixedConversionOptions,
  ) {
    this.verifyIsAutoLayout();

    cy.get(this.autoConvertButton).click({
      force: true,
    });

    cy.xpath(this.fixedModeConversionOptionButton(fixedConversionOption)).click(
      {
        force: true,
      },
    );

    cy.get(this.convertDialogButton).click({
      force: true,
    });

    cy.get("body").then(($body) => {
      if ($body.find(this.convertAnywaysDialogButton).length) {
        cy.get(this.convertAnywaysDialogButton).click({
          force: true,
        });
      }
    });

    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait("@snapshotSuccess").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(this.refreshAppDialogButton).click({
      force: true,
    });
    cy.wait(2000);

    this.verifyIsFixedLayout();
  }

  public useSnapshotFromBanner() {
    cy.get(this.useSnapshotBannerButton).click({
      force: true,
    });
    cy.get(this.useSnapshotDialogButton).click({
      force: true,
    });

    cy.wait(2000);

    cy.get(this.refreshAppDialogButton).click({
      force: true,
    });

    cy.wait(2000);
  }

  public discardSnapshot() {
    cy.get(this.discardSnapshotBannerButton).click({
      force: true,
    });
    cy.get(this.discardDialogButton).click({
      force: true,
    });
  }

  public verifyIsAutoLayout() {
    cy.closePropertyPane();
    cy.get(this.autoConvertButton).should("contain", "Fixed");
    cy.get(this.flexMainContainer).should("exist");
  }

  public verifyIsFixedLayout() {
    cy.closePropertyPane();
    cy.get(this.autoConvertButton).should("contain", "Auto");
    cy.get(this.flexMainContainer).should("not.exist");
  }

  public verifyCurrentWidgetIsAutolayout(widgetTypeName: string) {
    if (widgetTypeName === "modalwidget") {
      cy.get(`.t--modal-widget canvas`)
        .siblings('*[class^="flex-container"]')
        .should("exist");
    } else {
      cy.get(`.t--draggable-${widgetTypeName} canvas`)
        .siblings('*[class^="flex-container"]')
        .should("exist");
    }
  }

  public verifyCurrentWidgetIsFixedlayout(widgetTypeName: string) {
    if (widgetTypeName === "modalwidget") {
      cy.get(`.t--modal-widget canvas`)
        .siblings('*[class^="flex-container"]')
        .should("not.exist");
    } else {
      cy.get(`.t--draggable-${widgetTypeName} canvas`)
        .siblings('*[class^="flex-container"]')
        .should("not.exist");
    }
  }

  public verifyIfChildWidgetPositionInFlexContainer(
    canvasWrapperSelector: string,
    childWidgetSelector: string,
    layerIndex: number,
    alignment: Alignments,
  ) {
    cy.get(`${canvasWrapperSelector} canvas`)
      .siblings('*[class^="flex-container"]')
      .children()
      .eq(layerIndex)
      .children()
      .eq(alignmentIndex[alignment])
      .find(childWidgetSelector)
      .should("exist");
  }
}
