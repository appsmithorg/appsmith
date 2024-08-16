import generate from "nanoid/generate";
import {
  isEmptyTreeNode,
  isParentTreeNode,
} from "../../../common/libs/tree/Node";
import type {
  LeafTreeNode,
  ParentTreeNode,
  TreeNode,
} from "../../../common/libs/tree/types";
import type { ButtonVariant } from "../../enums/ButtonVariant";
import type { Colors } from "../../enums/Colors";
import type { DynamicPath } from "./DynamicPath";

export type PageElementType =
  | "CANVAS_WIDGET"
  | "SECTION_WIDGET"
  | "ZONE_WIDGET"
  | "WDS_BUTTON_WIDGET";

export interface PageElementWithDynamic {
  dynamicBindingPathList: DynamicPath[];
  dynamicTriggerPathList: DynamicPath[];
  dynamicPropertyPathList: DynamicPath[];
}

export interface BasePageElement extends TreeNode<PageElementType> {
  name: string;
  version: number;
}

export interface ParentPageElement
  extends BasePageElement,
    ParentTreeNode<PageElementType> {
  isLeaf: false;
  children: BasePageElement[];
}

export interface LeafPageElement
  extends BasePageElement,
    LeafTreeNode<PageElementType> {
  isLeaf: true;
  children: never;
}

export interface CanvasPageElement
  extends ParentPageElement,
    PageElementWithDynamic {
  type: "CANVAS_WIDGET";
  detachFromLayout: boolean;
}

export interface SectionPageElement
  extends ParentPageElement,
    PageElementWithDynamic {
  type: "SECTION_WIDGET";
  zoneCount: number;
  elevatedBackground: boolean;
  spaceDistributed: Record<string, number>;
}

export interface ZonePageElement
  extends ParentPageElement,
    PageElementWithDynamic {
  type: "ZONE_WIDGET";
  flexGrow: number;
  elevatedBackground: boolean;
}

export interface ButtonPageElement
  extends LeafPageElement,
    PageElementWithDynamic {
  type: "WDS_BUTTON_WIDGET";
  variant: keyof typeof ButtonVariant;
  color: keyof typeof Colors;
  isDisabled: boolean;
  isVisible: boolean;
}

export type PageElement =
  | CanvasPageElement
  | SectionPageElement
  | ZonePageElement
  | ButtonPageElement;

interface PageElementTypeMap {
  CANVAS_WIDGET: CanvasPageElement;
  SECTION_WIDGET: SectionPageElement;
  ZONE_WIDGET: ZonePageElement;
  WDS_BUTTON_WIDGET: ButtonPageElement;
}

export const generatePageElementId = (prefix = ""): string =>
  `${prefix}_${generate("1234567890abcdefghijklmnopqrstuvwxyz", 10)}`;

/**
 * Checks if a PageElement is of a given type and narrows the type
 *
 * @example
 * (checkElementType("CANVAS_WIDGET", element)); // true, element type is narrowed to CanvasPageElement
 *
 * @param type A type to check against
 * @param element The PageElement to check
 * @returns PageElement of the given type
 */
export const checkPageElementType = <TType extends PageElementType>(
  type: TType,
  element: PageElement,
): element is PageElementTypeMap[TType] => element.type === type;

export const isEmptyParentElement = isEmptyTreeNode;

// TYPE GUARDS
export const isParentPageElement = (
  element: PageElement,
): element is PageElement & ParentPageElement => isParentTreeNode(element);

export const isDynamicEnabled = (element: PageElementWithDynamic): boolean =>
  element.dynamicPropertyPathList.length > 0;
