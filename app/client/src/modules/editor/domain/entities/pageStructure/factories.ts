import { faker } from "@faker-js/faker";
import type {
  ButtonPageElement,
  CanvasPageElement,
  PageElement,
  SectionPageElement,
  ZonePageElement,
} from "./PageElement";
import type { DynamicPath } from "./DynamicPath";

export const makeDynamicPropertyPath = (
  override?: Partial<DynamicPath>,
): DynamicPath => ({
  key: faker.lorem.word(2),
  value: faker.lorem.word(2),
  version: faker.number.int(),
  ...override,
});

export type PageElementFactory<TElement extends PageElement = PageElement> = (
  override?: Partial<Omit<TElement, "type" | "isLeaf">>,
) => TElement;

export const makeCanvasPageElement: PageElementFactory<CanvasPageElement> = (
  override: Partial<Omit<CanvasPageElement, "type" | "isLeaf">> = {},
): CanvasPageElement => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(2),
  version: faker.number.int(),
  parentId: null,
  dynamicBindingPathList: [],
  dynamicTriggerPathList: [],
  dynamicPropertyPathList: [],
  detachFromLayout: faker.datatype.boolean(),
  children: [],
  ...override,
  type: "CANVAS_WIDGET",
  isLeaf: false,
});

export const makeSectionPageElement: PageElementFactory<SectionPageElement> = (
  override: Partial<Omit<SectionPageElement, "type">> = {},
): SectionPageElement => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(2),
  version: faker.number.int(),
  parentId: null,
  dynamicBindingPathList: [],
  dynamicTriggerPathList: [],
  dynamicPropertyPathList: [],
  zoneCount: 0,
  elevatedBackground: faker.datatype.boolean(),
  spaceDistributed: {},
  children: [],
  ...override,
  type: "SECTION_WIDGET",
  isLeaf: false,
});

export const makeZonePageElement: PageElementFactory<ZonePageElement> = (
  override: Partial<Omit<ZonePageElement, "type">> = {},
): ZonePageElement => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(2),
  version: faker.number.int(),
  parentId: null,
  dynamicBindingPathList: [],
  dynamicTriggerPathList: [],
  dynamicPropertyPathList: [],
  elevatedBackground: faker.datatype.boolean(),
  flexGrow: 0,
  children: [],
  ...override,
  type: "ZONE_WIDGET",
  isLeaf: false,
});

export const makeButtonWidgetPageElement: PageElementFactory<
  ButtonPageElement
> = (
  override: Partial<Omit<ButtonPageElement, "type">> = {},
): ButtonPageElement => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(2),
  version: faker.number.int(),
  parentId: null,
  dynamicBindingPathList: [],
  dynamicTriggerPathList: [],
  dynamicPropertyPathList: [],
  text: faker.lorem.words(2),
  variant: "filled",
  color: "neutral",
  isDisabled: false,
  isVisible: true,
  ...override,
  type: "WDS_BUTTON_WIDGET",
  isLeaf: true,
});
