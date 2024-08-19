import {
  makeButtonWidgetPageElement,
  makeCanvasPageElement,
  makeSectionPageElement,
  makeZonePageElement,
} from "../factories";
import { addPageElement } from "../PageStructure";

describe("addPageElement", () => {
  it("should add page element to root", () => {
    const zone = makeZonePageElement();
    const section = makeSectionPageElement({ children: [zone] });
    const canvas = makeCanvasPageElement({ children: [section] });
    const button = makeButtonWidgetPageElement();

    expect(addPageElement(canvas, zone.id, button).children[0]).toEqual({
      ...section,
      children: [
        {
          ...zone,
          children: [button],
        },
      ],
    });
  });

  it("should throw error if parent element not found", () => {
    const canvas = makeCanvasPageElement({
      children: [
        makeSectionPageElement({
          children: [makeZonePageElement()],
        }),
      ],
    });
    const button = makeButtonWidgetPageElement();

    expect(() => addPageElement(canvas, "not-existing-id", button)).toThrow(
      "Page element not-existing-id not found",
    );
  });

  it("should throw error if child element cannot be added", () => {
    const zone = makeZonePageElement();
    const section = makeSectionPageElement({ children: [zone] });
    const canvas = makeCanvasPageElement({ children: [section] });
    const button = makeButtonWidgetPageElement();

    expect(() => addPageElement(canvas, section.id, button)).toThrow(
      "Cannot add WDS_BUTTON_WIDGET to SECTION_WIDGET as child",
    );

    expect(() => addPageElement(canvas, zone.id, section)).toThrow(
      "Cannot add SECTION_WIDGET to ZONE_WIDGET as child",
    );

    expect(() => addPageElement(canvas, canvas.id, zone)).toThrow(
      "Cannot add ZONE_WIDGET to CANVAS_WIDGET as child",
    );
  });
});
