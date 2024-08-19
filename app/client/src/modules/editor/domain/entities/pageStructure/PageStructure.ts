import { addNode, findNode } from "../../../common/libs/tree/Tree";
import type {
  CanvasPageElement,
  PageElement,
  PageElementType,
  ParentPageElement,
} from "./PageElement";

export type PageStructure = CanvasPageElement;

const allowedChildrenMap: { [key in PageElementType]?: PageElementType[] } = {
  CANVAS_WIDGET: ["SECTION_WIDGET"],
  SECTION_WIDGET: ["ZONE_WIDGET"],
  ZONE_WIDGET: ["WDS_BUTTON_WIDGET"],
};

export const findPageElement = (
  rootPageElement: ParentPageElement,
  pageElementId: string,
): PageElement | null =>
  findNode(rootPageElement, pageElementId) as PageElement; // TODO: Remove casting

const canAddChild = (
  rootPageElement: PageElement,
  pageElement: PageElement,
): boolean => {
  return !allowedChildrenMap[rootPageElement.type]?.includes(pageElement.type);
};

export const addPageElement = <TElement extends ParentPageElement>(
  rootPageElement: TElement,
  targetPageElementId: string,
  pageElement: PageElement,
): TElement => {
  const targetPageElement = findPageElement(
    rootPageElement,
    targetPageElementId,
  );

  if (!targetPageElement) {
    throw new Error(`Page element ${targetPageElementId} not found`);
  }

  if (!canAddChild(targetPageElement, pageElement)) {
    throw new Error(
      `Cannot add ${pageElement.type} to ${rootPageElement.type} as child`,
    );
  }

  return addNode(rootPageElement, targetPageElementId, pageElement);
};
