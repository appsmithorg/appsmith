import { ObjectsRegistry } from "../Objects/Registry";
import { getWidgetSelector, WIDGET } from "../../locators/WidgetLocators";
import { AppSidebar, AppSidebarButton } from "./EditorNavigation";
import { featureFlagIntercept } from "../Objects/FeatureFlags";

type FixedConversionOptions = "DESKTOP" | "MOBILE";

type Alignments = "START" | "CENTER" | "END";

const alignmentIndex = {
  START: 0,
  CENTER: 1,
  END: 2,
};

export class AutoLayout {
  private entityExplorer = ObjectsRegistry.EntityExplorer;
  private propPane = ObjectsRegistry.PropertyPane;
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locators = ObjectsRegistry.CommonLocators;
  private assertHelper = ObjectsRegistry.AssertHelper;

  _buttonWidgetSelector = this.locators._widgetInDeployed(WIDGET.BUTTON);
  _buttonComponentSelector =
    this.locators._widgetInDeployed(WIDGET.BUTTON) + ` button`;
  _textWidgetSelector = this.locators._widgetInDeployed(WIDGET.TEXT);
  _textComponentSelector =
    this.locators._widgetInDeployed(WIDGET.TEXT) + ` .t--text-widget-container`;
  _containerWidgetSelector = getWidgetSelector(WIDGET.CONTAINER);

  _flexComponentClass = `*[class^="flex-container"]`;
  private _flexLayerClass = ".auto-layout-layer";

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

  public ConvertToAutoLayoutAndVerify(isNotNewApp = true) {
    cy.window().then((win) => {
      featureFlagIntercept({
        release_layout_conversion_enabled: true,
      });

      this.VerifyIsFixedLayout();

      this.agHelper.GetNClick(this.autoConvertButton, 0, true);

      this.agHelper.GetNClick(this.convertDialogButton, 0, true);

      this.assertHelper.AssertNetworkStatus("@updateApplication");
      if (isNotNewApp) {
        this.assertHelper.AssertNetworkStatus("@snapshotSuccess", 201);
      }

      this.agHelper.GetNClick(this.refreshAppDialogButton, 0, true);
      this.agHelper.Sleep(2000); //for page to refresh & all elements to load- trial fix for CI failure
      this.assertHelper.AssertNetworkStatus("@getWorkspace"); //getWorkspace for Edit page!

      this.VerifyIsAutoLayout();
    });
  }

  public ConvertToFixedLayoutAndVerify(
    fixedConversionOption: FixedConversionOptions,
  ) {
    cy.window().then((win) => {
      featureFlagIntercept({
        release_layout_conversion_enabled: true,
      });
      this.VerifyIsAutoLayout();

      this.agHelper.GetNClick(this.autoConvertButton, 0, true);

      this.agHelper.GetNClick(
        this.fixedModeConversionOptionButton(fixedConversionOption),
        0,
        true,
      );

      this.agHelper.GetNClick(this.convertDialogButton, 0, true);

      cy.get("body").then(($body) => {
        if ($body.find(this.convertAnywaysDialogButton).length) {
          this.agHelper.GetNClick(this.convertAnywaysDialogButton, 0, true);
        }
      });

      this.assertHelper.AssertNetworkStatus("@updateApplication");
      this.assertHelper.AssertNetworkStatus("@snapshotSuccess", 201);

      this.agHelper.GetNClick(this.refreshAppDialogButton, 0, true);
      cy.wait(2000);

      this.VerifyIsFixedLayout();
    });
  }

  public UseSnapshotFromBanner() {
    this.agHelper.GetNClick(this.useSnapshotBannerButton, 0, true);
    this.agHelper.GetNClick(this.useSnapshotDialogButton, 0, true);

    cy.wait(2000);

    this.agHelper.GetNClick(this.refreshAppDialogButton, 0, true);

    cy.wait(2000);
  }

  public DiscardSnapshot() {
    this.agHelper.GetNClick(this.discardSnapshotBannerButton, 0, true);
    this.agHelper.GetNClick(this.discardDialogButton, 0, true);
  }

  public VerifyIsAutoLayout() {
    AppSidebar.navigate(AppSidebarButton.Editor);
    this.agHelper.GetNClick(this.locators._selectionCanvas("0"), 0, true);
    this.agHelper.GetNAssertContains(this.autoConvertButton, "fixed layout");
    this.agHelper.AssertElementExist(this.flexMainContainer);
  }

  public VerifyIsFixedLayout() {
    AppSidebar.navigate(AppSidebarButton.Editor);
    this.agHelper.GetNClick(this.locators._selectionCanvas("0"), 0, true);
    cy.get(this.autoConvertButton).should("contain", "auto-layout");
    cy.get(this.flexMainContainer).should("not.exist");
  }

  public VerifyCurrentWidgetIsAutolayout(widgetTypeName: string) {
    if (widgetTypeName === WIDGET.MODAL) {
      cy.get(`${this.locators._modal} canvas`)
        .siblings(this._flexComponentClass)
        .should("exist");
    } else {
      cy.get(`${this.locators._widgetInCanvas(widgetTypeName)} canvas`)
        .siblings(this._flexComponentClass)
        .should("exist");
    }
  }

  public VerifyCurrentWidgetIsFixedlayout(widgetTypeName: string) {
    if (widgetTypeName === WIDGET.MODAL) {
      cy.get(`${this.locators._modal} canvas`)
        .siblings(this._flexComponentClass)
        .should("not.exist");
    } else {
      cy.get(`${this.locators._widgetInCanvas(widgetTypeName)} canvas`)
        .siblings(this._flexComponentClass)
        .should("not.exist");
    }
  }
  public getAutoLayoutLayerClassName(widgetId: string, index: number) {
    return `${this._flexLayerClass}-${widgetId}-${index}`;
  }

  public VerifyIfChildWidgetPositionInFlexContainer(
    canvasWrapperSelector: string,
    childWidgetSelector: string,
    layerIndex: number,
    alignment: Alignments,
  ) {
    cy.get(`${canvasWrapperSelector} canvas`)
      .siblings(this._flexComponentClass)
      .children()
      .eq(layerIndex)
      .children()
      .eq(alignmentIndex[alignment])
      .find(childWidgetSelector)
      .should("exist");
  }

  /**
   * Drag and drop a button widget and verify if the bounding box fits perfectly
   * after adjusting the label length
   *
   * @param {number} x
   * @param {number} y
   * @param {string} [dropTarget=""]
   */
  public DropButtonAndTestForAutoDimension(
    x: number,
    y: number,
    dropTarget = "",
  ) {
    this.entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, x, y, dropTarget);

    // Check if bounding box fits perfectly to the Button Widget
    this.EnsureBoundingBoxFitsComponent(
      this._buttonWidgetSelector,
      this._buttonComponentSelector,
    );

    // Increase the length of button label & verify if the component expands
    this.agHelper.GetWidth(this._buttonWidgetSelector);
    cy.get("@eleWidth").then(($initialWidth) => {
      this.propPane.UpdatePropertyFieldValue("Label", "Lengthy Button Label");
      this.agHelper.Sleep(2000); //to allow time for widget to resize itself before checking width again!
      this.agHelper.GetWidth(this._buttonWidgetSelector);
      cy.get("@eleWidth").then((width: any) => {
        //cy.get<number>("@initialWidth").then((initialWidth) => {
        expect(width).to.be.greaterThan(Number($initialWidth));
        //});
      });
    });

    // verify if the bounding box fits perfectly to the Button Widget after expanding
    this.EnsureBoundingBoxFitsComponent(
      this._buttonWidgetSelector,
      this._buttonComponentSelector,
    );

    // Decrease the length of button label & verify if the component shrinks
    this.agHelper.GetWidth(this._buttonWidgetSelector);
    cy.get("@eleWidth").then(($initialWidth) => {
      this.propPane.UpdatePropertyFieldValue("Label", "Short");
      this.agHelper.Sleep(2000); //to allow time for widget to resize itself before checking width again!
      this.agHelper.GetWidth(this._buttonWidgetSelector);
      cy.get("@eleWidth").then((width: any) => {
        expect(width).to.be.lessThan(Number($initialWidth));
      });
    });

    // verify if the bounding box fits perfectly to the Button Widget after expanding
    this.EnsureBoundingBoxFitsComponent(
      this._buttonWidgetSelector,
      this._buttonComponentSelector,
    );
  }

  /**
   * Drag and drop a text widget and verify if the bounding box fits perfectly
   * after adding & removing multi-line text
   *
   * @param {number} x
   * @param {number} y
   * @param {string} [dropTarget=""]
   */
  public DropTextAndTestForAutoDimension(
    x: number,
    y: number,
    dropTarget = "",
  ) {
    this.entityExplorer.DragDropWidgetNVerify(WIDGET.TEXT, x, y, dropTarget);

    // Check if bounding box fits perfectly to the Text Widget
    this.EnsureBoundingBoxFitsComponent(
      this._textWidgetSelector,
      this._textComponentSelector,
    );

    // Add multi-line text & verify if the component's height increases

    this.agHelper.GetHeight(this._textWidgetSelector);
    cy.get("@eleHeight").then(($initialHeight) => {
      this.propPane.UpdatePropertyFieldValue(
        "Text",
        "hello\nWorld\nThis\nis\na\nMulti-line\nText",
      );
      this.agHelper.Sleep(); //to allow time for widget to resize itself before checking height again!
      this.agHelper.GetHeight(this._textWidgetSelector);
      cy.get("@eleHeight").then((height: any) => {
        expect(height).to.be.greaterThan(Number($initialHeight));
      });
    });

    // Check if bounding box fits perfectly to the Text Widget
    this.EnsureBoundingBoxFitsComponent(
      this._textWidgetSelector,
      this._textComponentSelector,
    );

    // Remove some lines & verify if the component's height decreases

    this.agHelper.GetHeight(this._textWidgetSelector);
    cy.get("@eleHeight").then(($initialHeight) => {
      this.propPane.UpdatePropertyFieldValue("Text", "hello\nWorld\nblabla");
      this.agHelper.Sleep(); //to allow time for widget to resize itself before checking width again!
      this.agHelper.GetHeight(this._textWidgetSelector);
      cy.get("@eleHeight").then((height: any) => {
        expect(height).to.be.lessThan(Number($initialHeight));
      });
    });

    // Check if bounding box fits perfectly to the Text Widget
    this.EnsureBoundingBoxFitsComponent(
      this._textWidgetSelector,
      this._textComponentSelector,
    );
  }

  /**
   * Ensures that the bounding box of a widget fits perfectly with the component.
   *
   * @param {string} widgetSelector - Selector for the widget element.
   * @param {string} componentSelector - Selector for the component element.
   * @returns {void}
   */
  public EnsureBoundingBoxFitsComponent(
    widgetSelector: string,
    componentSelector: string,
  ) {
    // TODO(aswathkk): Delta should be made 0.5 once the issue with list widget in mobile view is fixed.
    const DELTA = 1;
    this.agHelper.GetElement(widgetSelector).then(($widget) => {
      const widgetRect = $widget[0].getBoundingClientRect();
      cy.log("widgetRect.x is " + widgetRect.x);
      this.agHelper.GetElement(componentSelector).then(($component) => {
        const componentRect = $component[0].getBoundingClientRect();
        expect(widgetRect.x).to.be.closeTo(componentRect.x - 2, DELTA);
        expect(widgetRect.y).to.be.closeTo(componentRect.y - 2, DELTA);
        expect(widgetRect.top).to.be.closeTo(componentRect.top - 2, DELTA);
        expect(widgetRect.bottom).to.be.closeTo(
          componentRect.bottom + 2,
          DELTA,
        );
        expect(widgetRect.left).to.be.closeTo(componentRect.left - 2, DELTA);
        expect(widgetRect.right).to.be.closeTo(componentRect.right + 2, DELTA);
        expect(widgetRect.height).to.be.closeTo(
          componentRect.height + 4,
          DELTA,
        );
        expect(widgetRect.width).to.be.closeTo(componentRect.width + 4, DELTA);
      });
    });
  }
}
