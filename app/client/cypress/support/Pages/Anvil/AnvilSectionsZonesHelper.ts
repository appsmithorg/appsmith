import { WIDGET } from "../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../Objects/Registry";
import { anvilLocators } from "./Locators";

export class AnvilSectionsZonesHelper {
  protected agHelper = ObjectsRegistry.AggregateHelper;

  public verifyZoneCount(
    sectionOrZoneName: string,
    zoneCount: number,
    verifyZoneCountOnPropertyPane = false,
  ) {
    const sectionSelector =
      anvilLocators.anvilWidgetNameSelector(sectionOrZoneName);

    const zoneWidgetsSelector = `${sectionSelector} ${anvilLocators.anvilWidgetTypeSelector(WIDGET.ZONE)}`;
    // verify all zones in the section
    this.agHelper
      .GetElement(zoneWidgetsSelector)
      .should("have.length", zoneCount);
    // verify zone count on property pane
    if (verifyZoneCountOnPropertyPane) {
      // select the widget
      this.agHelper.GetNClick(sectionSelector);
      this.agHelper
        .GetElement(anvilLocators.anvilZoneStepperControlInputValue)
        .should("have.value", zoneCount.toString());
    }
  }

  public incrementZones(sectionOrZoneName: string) {
    this.agHelper
      .GetNClick(anvilLocators.anvilWidgetNameSelector(sectionOrZoneName))
      .then(() => {
        this.agHelper
          .GetElement(anvilLocators.anvilZoneStepperControlSelector("add"))
          .click();
      });
  }

  public decrementZones(sectionOrZoneName: string) {
    this.agHelper.GetNClick(
      anvilLocators.anvilWidgetNameSelector(sectionOrZoneName),
    );
    this.agHelper
      .GetElement(anvilLocators.anvilZoneStepperControlSelector("remove"))
      .click();
  }
}
