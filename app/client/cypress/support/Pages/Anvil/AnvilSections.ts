import { WIDGET } from "../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../Objects/Registry";
import { AnvilSelectors } from "./AnvilSelectors";

export class AnvilSections extends AnvilSelectors {
  protected agHelper = ObjectsRegistry.AggregateHelper;

  public verifyZoneCount(
    sectionOrZoneName: string,
    zoneCount: number,
    verifyZoneCountOnPropertyPane = false,
  ) {
    const sectionSelector = this.anvilWidgetNameSelector(sectionOrZoneName);

    const zoneWidgetsSelector = `${sectionSelector} ${this.anvilWidgetTypeSelector(WIDGET.ZONE)}`;
    // verify all zones in the section
    this.agHelper
      .GetElement(zoneWidgetsSelector)
      .should("have.length", zoneCount);
    // verify zone count on property pane
    if (verifyZoneCountOnPropertyPane) {
      // select the widget
      this.agHelper.GetNClick(sectionSelector);
      this.agHelper
        .GetElement(this.anvilZoneStepperControlInputValue)
        .should("have.value", zoneCount.toString());
    }
  }

  public incrementZones(sectionOrZoneName: string) {
    this.agHelper
      .GetNClick(this.anvilWidgetNameSelector(sectionOrZoneName))
      .then(() => {
        this.agHelper
          .GetElement(this.anvilZoneStepperControlSelector("add"))
          .click();
      });
  }

  public decrementZones(sectionOrZoneName: string) {
    this.agHelper.GetNClick(this.anvilWidgetNameSelector(sectionOrZoneName));
    this.agHelper
      .GetElement(this.anvilZoneStepperControlSelector("remove"))
      .click();
  }
}
