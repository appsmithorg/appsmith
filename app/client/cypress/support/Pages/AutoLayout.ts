import { ObjectsRegistry } from "../Objects/Registry";
import { getWidgetSelector, WIDGET } from "../../locators/WidgetLocators";
import { CONVERT_TO_AUTO_BUTTON } from "../../../src/ce/constants/messages";

export class AutoLayout {
  private entityExplorer = ObjectsRegistry.EntityExplorer;
  private propPane = ObjectsRegistry.PropertyPane;
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locator = ObjectsRegistry.CommonLocators;

  _buttonWidgetSelector = this.locator._widgetInDeployed(WIDGET.BUTTON);
  _buttonComponentSelector =
    this.locator._widgetInDeployed(WIDGET.BUTTON) + ` button`;
  _textWidgetSelector = this.locator._widgetInDeployed(WIDGET.TEXT);
  _textComponentSelector =
    this.locator._widgetInDeployed(WIDGET.TEXT) + ` .t--text-widget-container`;
  _containerWidgetSelector = getWidgetSelector(WIDGET.CONTAINER);
  private _autoConvert = "#t--layout-conversion-cta";
  private _convert = "button:contains('Convert layout')";
  private _refreshApp = "button:contains('Refresh the app')";

  /**
   * Drag and drop a button widget and verify if the bounding box fits perfectly
   * after adjusting the label length
   *
   * @param {number} x
   * @param {number} y
   * @param {string} [dropTarget=""]
   */
  DropButtonAndTestForAutoDimension(x: number, y: number, dropTarget = "") {
    this.entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, x, y, dropTarget);

    // Check if bounding box fits perfectly to the Button Widget
    this.EnsureBoundingBoxFitsComponent(
      this._buttonWidgetSelector,
      this._buttonComponentSelector,
    );

    // Increase the length of button label & verify if the component expands
    this.agHelper
      .GetWidgetWidth(this._buttonWidgetSelector)
      .then(($initialWidth) => {
        this.propPane.UpdatePropertyFieldValue("Label", "Lengthy Button Label");
        //this.agHelper.Sleep(5000);//to allow time for widget to resize itself before checking Height again!
        this.agHelper
          .GetWidgetWidth(this._buttonWidgetSelector)
          .then((width: any) => {
            //cy.get<number>("@initialWidth").then((initialWidth) => {
            expect(width).to.be.greaterThan($initialWidth);
            //});
          });
      });

    // verify if the bounding box fits perfectly to the Button Widget after expanding
    this.EnsureBoundingBoxFitsComponent(
      this._buttonWidgetSelector,
      this._buttonComponentSelector,
    );

    // Decrease the length of button label & verify if the component shrinks
    this.agHelper
      .GetWidgetWidth(this._buttonWidgetSelector)
      .then(($initialWidth) => {
        this.propPane.UpdatePropertyFieldValue("Label", "Label");
        this.agHelper
          .GetWidgetWidth(this._buttonWidgetSelector)
          .then((width: any) => {
            expect(width).to.be.lessThan($initialWidth);
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
  DropTextAndTestForAutoDimension(x: number, y: number, dropTarget = "") {
    this.entityExplorer.DragDropWidgetNVerify(WIDGET.TEXT, x, y, dropTarget);

    // Check if bounding box fits perfectly to the Text Widget
    this.EnsureBoundingBoxFitsComponent(
      this._textWidgetSelector,
      this._textComponentSelector,
    );

    // Add multi-line text & verify if the component's height increases

    this.agHelper
      .GetWidgetHeight(this._textWidgetSelector)
      .then(($initialHeight) => {
        this.propPane.UpdatePropertyFieldValue(
          "Text",
          "hello\nWorld\nThis\nis\na\nMulti-line\nText",
        );
        this.agHelper
          .GetWidgetHeight(this._textWidgetSelector)
          .then((height: any) => {
            expect(height).to.be.greaterThan($initialHeight);
          });
      });

    // Check if bounding box fits perfectly to the Text Widget
    this.EnsureBoundingBoxFitsComponent(
      this._textWidgetSelector,
      this._textComponentSelector,
    );

    // Remove some lines & verify if the component's height decreases

    this.agHelper
      .GetWidgetHeight(this._textWidgetSelector)
      .then(($initialHeight) => {
        this.propPane.UpdatePropertyFieldValue("Text", "hello\nWorld\nblabla");
        this.agHelper
          .GetWidgetHeight(this._textWidgetSelector)
          .then((height: any) => {
            expect(height).to.be.lessThan($initialHeight);
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
  EnsureBoundingBoxFitsComponent(
    widgetSelector: string,
    componentSelector: string,
  ) {
    // TODO(aswathkk): Delta should be made 0.5 once the issue with list widget in mobile view is fixed.
    const DELTA = 1;
    this.agHelper.GetElement(widgetSelector).then((widget) => {
      const widgetRect = widget.get(0).getBoundingClientRect();
      this.agHelper.GetElement(componentSelector).then((component) => {
        const componentRect = component.get(0).getBoundingClientRect();
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

  /**
   * Converts the layout to auto layout if not already converted
   */
  public ConvertToAutoLayout() {
    this.agHelper
      .GetElement(this._autoConvert)
      .invoke("text")
      .then((text: string) => {
        if (text === CONVERT_TO_AUTO_BUTTON()) {
          this.agHelper.GetNClick(this._autoConvert);
          this.agHelper.GetNClick(this._convert);
          this.agHelper.GetNClick(this._refreshApp);
        }
      });
  }
}
