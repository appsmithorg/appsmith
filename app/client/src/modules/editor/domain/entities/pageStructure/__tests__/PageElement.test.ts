import { faker } from "@faker-js/faker";
import type { PageElementType } from "../PageElement";
import {
  checkPageElementType,
  generatePageElementId,
  hasDynamicProperties,
} from "../PageElement";
import {
  makeButtonWidgetPageElement,
  makeCanvasPageElement,
  makeDynamicPropertyPath,
  makeSectionPageElement,
  makeZonePageElement,
  type PageElementFactory,
} from "../factories";

describe("generatePageElementId", () => {
  it("should generate id", () => {
    const id = generatePageElementId();

    expect(id).toMatch(/[a-z0-9]{10}/);
  });

  it("should generate id with prefix", () => {
    const prefix = faker.lorem.word(1);
    const id = generatePageElementId(prefix);

    expect(id).toMatch(new RegExp(`${prefix}_[a-z0-9]{10}`));
  });
});

describe("checkPageElementType", () => {
  it.each<[PageElementType, PageElementFactory]>([
    ["CANVAS_WIDGET", makeCanvasPageElement],
    ["SECTION_WIDGET", makeSectionPageElement],
    ["ZONE_WIDGET", makeZonePageElement],
    ["WDS_BUTTON_WIDGET", makeButtonWidgetPageElement],
  ])("should return true if element type matches", (type, maker) => {
    expect(checkPageElementType(type, maker())).toBe(true);
  });

  it("should return false if element type does not match", () => {
    expect(
      checkPageElementType("CANVAS_WIDGET", makeSectionPageElement()),
    ).toBe(false);
  });
});

describe("hasDynamicProperties", () => {
  it("should return true if element has dynamic properties", () => {
    const element = makeButtonWidgetPageElement({
      dynamicPropertyPathList: [makeDynamicPropertyPath()],
    });

    expect(hasDynamicProperties(element)).toBe(true);
  });

  it("should return false if element does not have dynamic properties", () => {
    const element = makeButtonWidgetPageElement({
      dynamicPropertyPathList: [],
    });

    expect(hasDynamicProperties(element)).toBe(false);
  });
});
