import { WIDGET } from "../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../Objects/Registry";
import { anvilLocators } from "./Locators";
import { SectionColumns } from "../../../../src/layoutSystems/anvil/sectionSpaceDistributor/constants";

export class AnvilSectionsZonesHelper {
  protected agHelper = ObjectsRegistry.AggregateHelper;

  public moveDistributionHandle(
    direction: "left" | "right",
    sectionName: string,
    distributionHandleIndex: number,
    ticksToMove: number,
  ) {
    const distributionHandleSelector = `${anvilLocators.anvilWidgetNameSelector(sectionName)} ${anvilLocators.anvilSectionDistributionHandle}:nth-child(${distributionHandleIndex})`;
    // get the width of the section
    const sectionSelector = anvilLocators.anvilWidgetNameSelector(sectionName);
    cy.get(sectionSelector).then(($section) => {
      const sectionWidth = $section.width() || 0;
      const tickWidth = sectionWidth / SectionColumns;
      const moveHandleBy = ticksToMove * tickWidth;
      // move distribution handle by the given ticks width in the given direction from the position of the handle
      cy.get(distributionHandleSelector).trigger("mousedown");
      cy.get(distributionHandleSelector).realMouseMove(
        direction === "left" ? -moveHandleBy : moveHandleBy,
        0,
      );
      cy.get(distributionHandleSelector).trigger("mouseup");
    });
  }

  public mouseDownSpaceDistributionHandle(
    sectionName: string,
    distributionHandleIndex: number,
  ) {
    const distributionHandleSelector = `${anvilLocators.anvilWidgetNameSelector(sectionName)} ${anvilLocators.anvilSectionDistributionHandle}:nth-child(${distributionHandleIndex})`;
    cy.get(distributionHandleSelector).trigger("mousedown");
  }

  public mouseUpSpaceDistributionHandle(
    sectionName: string,
    distributionHandleIndex: number,
  ) {
    const distributionHandleSelector = `${anvilLocators.anvilWidgetNameSelector(sectionName)} ${anvilLocators.anvilSectionDistributionHandle}:nth-child(${distributionHandleIndex})`;
    cy.get(distributionHandleSelector).trigger("mouseup");
  }

  public verifyZoneCount(
    sectionOrZoneName: string,
    zoneCount: number,
    verifyZoneCountOnPropertyPane = false,
  ) {
    const sectionSelector =
      anvilLocators.anvilWidgetNameSelector(sectionOrZoneName);

    const zoneWidgetsSelector = `${sectionSelector} ${anvilLocators.anvilWidgetTypeSelector(anvilLocators.ZONE)}`;
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

  public verifySectionDistribution(
    sectionName: string,
    distributionValue: number[],
  ) {
    this.agHelper
      .GetNClick(anvilLocators.anvilWidgetNameSelector(sectionName))
      .then(() => {
        cy.get(anvilLocators.anvilZoneDistributionValue).each((zone, index) => {
          cy.wrap(zone).should(
            "have.text",
            distributionValue.length === 1
              ? `${distributionValue[0]} columns`
              : distributionValue[index].toString(),
          );
        });
      });
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
