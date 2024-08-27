import type { MetaWidgetsReduxState } from "./metaWidgetsReducer";
import reducer, {
  initialState as reducerInitialState,
} from "./metaWidgetsReducer";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { metaWidgetState } from "utils/metaWidgetState";
import { nestedMetaWidgetInitialState } from "./testData/metaWidgetReducer";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "ee/utils/airgapHelpers";

const modifiedState: MetaWidgetsReduxState = {
  baowuczcgg: {
    parentColumnSpace: 1,
    parentRowSpace: 1,
    isVisible: true,
    defaultImage: getAssetUrl(`${ASSETS_CDN_URL}/widgets/default.png`),
    imageShape: "RECTANGLE",
    maxZoomLevel: 1,
    enableRotation: false,
    enableDownload: false,
    objectFit: "cover",
    image: "{{((currentItem) => currentItem.img)(Image1.currentItem)}}",
    widgetName: "Image1",
    version: 1,
    animateLoading: true,
    type: "IMAGE_WIDGET",
    hideCard: false,
    isDeprecated: false,
    displayName: "Image",
    key: "zqar6ryg82",
    iconSVG: "/static/media/icon.52d8fb963abcb95c79b10f1553389f22.svg",
    boxShadow: "none",
    dynamicBindingPathList: [
      {
        key: "image",
      },
      {
        key: "borderRadius",
      },
      {
        key: "currentItem",
      },
      {
        key: "currentView",
      },
    ],
    dynamicTriggerPathList: [],
    widgetId: "baowuczcgg",
    renderMode: "CANVAS",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    isLoading: false,
    leftColumn: 0,
    rightColumn: 16,
    topRow: 0,
    bottomRow: 8,
    parentId: "xbbs7cls18",

    currentItem: "{{List1.listData[Image1.currentIndex]}}",
    currentView: "{{{}}}",
    currentIndex: 0,
    children: [],
    referencedWidgetId: "baowuczcgg",
    isMetaWidget: true,
    creatorId: "hwgin979n4",
  },
  xy20z9gxsc: {
    parentColumnSpace: 1,
    parentRowSpace: 1,
    isVisible: true,
    text: "{{((currentItem) => currentItem.name)(Text1.currentItem)}}",
    fontSize: "1rem",
    fontStyle: "BOLD",
    textAlign: "LEFT",
    textColor: "#231F20",
    truncateButtonColor: "#FFC13D",
    widgetName: "Text1",
    shouldTruncate: false,
    overflow: "NONE",
    version: 1,
    animateLoading: true,
    searchTags: ["typography", "paragraph", "label"],
    type: "TEXT_WIDGET",
    hideCard: false,
    isDeprecated: false,
    displayName: "Text",
    key: "eezvtpz4sw",
    iconSVG: "/static/media/icon.97c59b523e6f70ba6f40a10fc2c7c5b5.svg",
    textStyle: "HEADING",
    boxShadow: "none",
    dynamicBindingPathList: [
      {
        key: "text",
      },
      {
        key: "fontFamily",
      },
      {
        key: "borderRadius",
      },
      {
        key: "currentItem",
      },
      {
        key: "currentView",
      },
    ],
    dynamicTriggerPathList: [],
    widgetId: "xy20z9gxsc",
    renderMode: "CANVAS",
    fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    isLoading: false,
    leftColumn: 16,
    rightColumn: 28,
    topRow: 0,
    bottomRow: 4,
    parentId: "xbbs7cls18",

    currentItem: "{{List1.listData[Text1.currentIndex]}}",
    currentView: "{{{}}}",
    currentIndex: 0,
    children: [],
    referencedWidgetId: "xy20z9gxsc",
    isMetaWidget: true,
    creatorId: "hwgin979n4",
  },
  tsdy8whhl1: {
    parentColumnSpace: 1,
    parentRowSpace: 1,
    isVisible: true,
    text: "{{((currentItem) => currentItem.id)(Text2.currentItem)}}",
    fontSize: "1rem",
    fontStyle: "BOLD",
    textAlign: "LEFT",
    textColor: "#231F20",
    truncateButtonColor: "#FFC13D",
    widgetName: "Text2",
    shouldTruncate: false,
    overflow: "NONE",
    version: 1,
    animateLoading: true,
    searchTags: ["typography", "paragraph", "label"],
    type: "TEXT_WIDGET",
    hideCard: false,
    isDeprecated: false,
    displayName: "Text",
    key: "eezvtpz4sw",
    iconSVG: "/static/media/icon.97c59b523e6f70ba6f40a10fc2c7c5b5.svg",
    textStyle: "BODY",
    boxShadow: "none",
    dynamicBindingPathList: [
      {
        key: "text",
      },
      {
        key: "fontFamily",
      },
      {
        key: "borderRadius",
      },
      {
        key: "currentItem",
      },
      {
        key: "currentView",
      },
    ],
    dynamicTriggerPathList: [],
    widgetId: "tsdy8whhl1",
    renderMode: "CANVAS",
    fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    isLoading: false,
    leftColumn: 16,
    rightColumn: 24,
    topRow: 4,
    bottomRow: 8,
    parentId: "xbbs7cls18",

    currentItem: "{{List1.listData[Text2.currentIndex]}}",
    currentView: "{{{}}}",
    currentIndex: 0,
    children: [],
    referencedWidgetId: "tsdy8whhl1",
    isMetaWidget: true,
    creatorId: "hwgin979n4",
  },
  xbbs7cls18: {
    isVisible: true,
    widgetName: "Canvas2",
    version: 1,
    detachFromLayout: true,
    type: "CANVAS_WIDGET",
    hideCard: true,
    isDeprecated: false,
    displayName: "Canvas",
    key: "rhrv9ccmof",
    containerStyle: "none",
    canExtend: false,
    children: ["baowuczcgg", "xy20z9gxsc", "tsdy8whhl1"],
    minHeight: 1,
    widgetId: "xbbs7cls18",
    renderMode: "CANVAS",
    boxShadow: "none",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    isLoading: false,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    leftColumn: 0,
    rightColumn: 1,
    topRow: 0,
    bottomRow: 1,
    parentId: "e3bqqc9oid",
    dynamicBindingPathList: [
      {
        key: "borderRadius",
      },
      {
        key: "accentColor",
      },
      {
        key: "currentView",
      },
    ],

    currentView: "{{{}}}",
    currentIndex: 0,
    referencedWidgetId: "xbbs7cls18",
    isMetaWidget: true,
    creatorId: "hwgin979n4",
  },
  e3bqqc9oid: {
    isVisible: true,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    backgroundColor: "white",
    widgetName: "Container1",
    containerStyle: "card",
    borderColor: "#E0DEDE",
    borderWidth: "1",
    boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    animateLoading: true,
    children: ["xbbs7cls18"],
    version: 1,
    searchTags: ["div", "parent", "group"],
    type: "CONTAINER_WIDGET",
    hideCard: false,
    isDeprecated: false,
    displayName: "Container",
    key: "b33ov8lfex",
    iconSVG: "/static/media/icon.1977dca3370505e2db3a8e44cfd54907.svg",
    isCanvas: true,
    dragDisabled: true,
    isDeletable: false,
    disallowCopy: true,
    disablePropertyPane: true,
    openParentPropertyPane: true,
    widgetId: "e3bqqc9oid",
    renderMode: "CANVAS",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    isLoading: false,
    leftColumn: 0,
    rightColumn: 64,
    topRow: 0,
    bottomRow: 12,
    parentId: "8ari8fii6k",
    dynamicBindingPathList: [
      {
        key: "borderRadius",
      },
      {
        key: "boxShadow",
      },
      {
        key: "data",
      },
    ],

    gap: 0,
    data: "{{\n      {\n        \n          Image1: { image: Image1.image,isVisible: Image1.isVisible }\n        ,\n          Text1: { isVisible: Text1.isVisible,text: Text1.text }\n        ,\n          Text2: { isVisible: Text2.isVisible,text: Text2.text }\n        \n      }\n    }}",
    currentIndex: 0,
    referencedWidgetId: "e3bqqc9oid",
    isMetaWidget: true,
    creatorId: "hwgin979n4",
  },
  "8ari8fii6k": {
    isVisible: true,
    widgetName: "Canvas1",
    version: 1,
    detachFromLayout: true,
    type: "CANVAS_WIDGET",
    hideCard: true,
    isDeprecated: false,
    displayName: "Canvas",
    key: "rhrv9ccmof",
    containerStyle: "none",
    dropDisabled: true,
    openParentPropertyPane: true,
    noPad: true,
    children: ["e3bqqc9oid"],
    minHeight: 190,
    widgetId: "8ari8fii6k",
    renderMode: "CANVAS",
    boxShadow: "none",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    isLoading: false,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    leftColumn: 0,
    rightColumn: 314.25,
    topRow: 0,
    bottomRow: 154,
    parentId: "hwgin979n4",
    dynamicBindingPathList: [
      {
        key: "borderRadius",
      },
      {
        key: "accentColor",
      },
    ],

    isMetaWidget: true,
    creatorId: "hwgin979n4",
  },
};

describe("meta widget reducer test", () => {
  it("DELETE_META_WIDGETS", () => {
    const creatorId = "u9ibqgimu2";
    const expectedState: Record<string, unknown> = {};
    Object.entries(nestedMetaWidgetInitialState).forEach(
      ([widgetId, widgetProps]) => {
        if (widgetProps.creatorId !== creatorId) {
          expectedState[widgetId] = widgetProps;
        }
      },
    );

    expect(
      reducer(nestedMetaWidgetInitialState, {
        type: ReduxActionTypes.DELETE_META_WIDGETS,
        payload: {
          creatorIds: [creatorId],
        },
      }),
    ).toEqual(expectedState);
  });
  it("INIT_CANVAS_LAYOUT", () => {
    expect(
      reducer(metaWidgetState, {
        type: ReduxActionTypes.INIT_CANVAS_LAYOUT,
        payload: {},
      }),
    ).toEqual(metaWidgetState);
  });
  it("MODIFY_META_WIDGETS", () => {
    expect(
      reducer(metaWidgetState, {
        type: ReduxActionTypes.MODIFY_META_WIDGETS,
        payload: {
          addOrUpdate: {
            "8ari8fii6k": {
              isVisible: true,
              widgetName: "Canvas1",
              version: 1,
              detachFromLayout: true,
              type: "CANVAS_WIDGET",
              hideCard: true,
              isDeprecated: false,
              displayName: "Canvas",
              key: "rhrv9ccmof",
              containerStyle: "none",
              dropDisabled: true,
              openParentPropertyPane: true,
              noPad: true,
              children: ["e3bqqc9oid"],
              minHeight: 190,
              widgetId: "8ari8fii6k",
              renderMode: "CANVAS",
              boxShadow: "none",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              isLoading: false,
              parentColumnSpace: 1,
              parentRowSpace: 1,
              leftColumn: 0,
              rightColumn: 314.25,
              topRow: 0,
              bottomRow: 154,
              parentId: "hwgin979n4",
              dynamicBindingPathList: [
                {
                  key: "borderRadius",
                },
                {
                  key: "accentColor",
                },
              ],

              isMetaWidget: true,
              creatorId: "hwgin979n4",
            },
          },
          deleteIds: [
            "u2jvh7h1f1",
            "pawh54e2lk",
            "o6yxt84kj5",
            "ze1bnh8dpw",
            "4b5r4c3kp7",
            "3vmg2xwodp",
            "squbljzvqv",
            "zoq1nw5wke",
            "gb0vgfvp68",
            "3g3bxw6q2z",
          ],
          propertyUpdates: [],
          creatorId: "hwgin979n4",
        },
      }),
    ).toEqual(modifiedState);
  });

  it("should reset to initial state on RESET_EDITOR_REQUEST", () => {
    const initialState = {
      "0": { children: ["xyz123"] },
      xyz123: {
        bottomRow: 20,
        topRow: 10,
        someValue: {
          apple: "orange",
          games: {
            ball: ["football"],
          },
        },
      },
    };

    const result = reducer(initialState, {
      type: ReduxActionTypes.RESET_EDITOR_REQUEST,
      payload: undefined,
    });

    expect(result).toStrictEqual(reducerInitialState);
  });
});
