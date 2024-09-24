import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { registerLayoutComponents } from "../../layouts/layoutUtils";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { getDestinedParent } from ".";
import { generateMockDataWithSectionAndZone } from "./mockData.helper";

describe("paste destination utils tests", () => {
  beforeAll(() => {
    registerLayoutComponents();
  });
  it("should correctly identify the parent hierarchy for a copied widget when no widget is selected", () => {
    const { allWidgets, copiedWidgets } = generateMockDataWithSectionAndZone();
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedWidget: any = allWidgets[MAIN_CONTAINER_WIDGET_ID];
    const generator = getDestinedParent(
      allWidgets,
      copiedWidgets,
      selectedWidget,
    );
    const result = generator.next().value;

    expect(result.parentOrder).toEqual([MAIN_CONTAINER_WIDGET_ID]);
    // correctly identifies the parent hierarchy for a single copied widget
    expect(result.alignment).toEqual(FlexLayerAlignment.Start);
    // target adding to the main canvas layout
    expect(result.layoutOrder).toEqual(
      allWidgets[MAIN_CONTAINER_WIDGET_ID].layout,
    );
    // target adding to the main canvas layout in position 1
    expect(result.rowIndex).toEqual([1]);
  });
  it("should correctly identify the parent hierarchy for a copied widget when a widget is selected", () => {
    const { allWidgets, copiedWidgets, mockWidgetId } =
      generateMockDataWithSectionAndZone();
    const selectedWidget = allWidgets[mockWidgetId];
    const generator = getDestinedParent(
      allWidgets,
      copiedWidgets,
      selectedWidget,
    );
    const result = generator.next().value;

    // correctly identifies the parent hierarchy for copied widgets
    expect(result.parentOrder).toEqual(["widget-mock", "zone-mock"]);
    expect(result.alignment).toEqual(FlexLayerAlignment.Start);
    expect(result.rowIndex).toEqual([1, 1, 1]);
  });
});
