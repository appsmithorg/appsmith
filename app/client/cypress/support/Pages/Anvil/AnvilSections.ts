import { WIDGET } from "../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../Objects/Registry";
import { AnvilSelectors } from "./AnvilSelectors";

export class AnvilSections {
  protected agHelper = ObjectsRegistry.AggregateHelper;

  public verifyZoneCount(
    sectionOrZoneName: string,
    zoneCount: number,
    verifyZoneCountOnPropertyPane = false,
  ) {
    const sectionSelector =
      AnvilSelectors.anvilWidgetNameSelector(sectionOrZoneName);

    const zoneWidgetsSelector = `${sectionSelector} ${AnvilSelectors.anvilWidgetTypeSelector(WIDGET.ZONE)}`;
    // verify all zones in the section
    this.agHelper
      .GetElement(zoneWidgetsSelector)
      .should("have.length", zoneCount);
    // verify zone count on property pane
    if (verifyZoneCountOnPropertyPane) {
      // select the widget
      this.agHelper.GetNClick(sectionSelector);
      this.agHelper
        .GetElement(AnvilSelectors.anvilZoneStepperControlInputValue)
        .should("have.value", zoneCount.toString());
    }
  }

  public incrementZones(sectionOrZoneName: string) {
    this.agHelper
      .GetNClick(AnvilSelectors.anvilWidgetNameSelector(sectionOrZoneName))
      .then(() => {
        this.agHelper
          .GetElement(AnvilSelectors.anvilZoneStepperControlSelector("add"))
          .click();
      });
  }

  public decrementZones(sectionOrZoneName: string) {
    this.agHelper.GetNClick(
      AnvilSelectors.anvilWidgetNameSelector(sectionOrZoneName),
    );
    this.agHelper
      .GetElement(AnvilSelectors.anvilZoneStepperControlSelector("remove"))
      .click();
  }
}
