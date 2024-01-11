import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";

export const getAllWidgetIds = (widget: CanvasStructure): string[] =>
  (widget.widgetId ? [widget.widgetId] : []).concat(
    (widget.children || []).flatMap((child) => getAllWidgetIds(child)),
  );

export const mockTblUserInfoWidgetId = "30s2xz9lqx";
export const mockWidgetsProps = {
  widgetId: "0",
  widgetName: "MainContainer",
  type: "CANVAS_WIDGET",
  children: [
    {
      widgetId: "76t6mkfckv",
      widgetName: "txt_pageTitle",
      type: "TEXT_WIDGET",
    },
    {
      widgetId: "30s2xz9lqx",
      widgetName: "tbl_userInfo",
      type: "TABLE_WIDGET_V2",
    },
    {
      widgetId: "gz1wda6co5",
      widgetName: "con_userDetails",
      type: "FORM_WIDGET",
      children: [
        {
          widgetId: "ksqoq712gb",
          widgetName: "txt_userFullName",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "2xoes8wilz",
          widgetName: "txt_countryValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "av2rmb7w6k",
          widgetName: "txt_updatedAtValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "49fw3yiijl",
          widgetName: "txt_createdAtValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "yrnf6ebevh",
          widgetName: "txt_longitudeValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "z5vabtkhbb",
          widgetName: "txt_latitudeValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "308vo9jh63",
          widgetName: "txt_phoneValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "5qcop7cwtm",
          widgetName: "txt_dobValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "oid24ma9vw",
          widgetName: "txt_genderValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "y4kqr6s084",
          widgetName: "txt_userEmail",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "u753uo6af8",
          widgetName: "txt_country",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "gsgr0ynhbb",
          widgetName: "txt_updatedAt",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "3etip5rg1a",
          widgetName: "txt_createdAt",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "81esy5jfi0",
          widgetName: "txt_longitude",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "z5j3zsmu38",
          widgetName: "txt_latitude",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "v03001ino4",
          widgetName: "txt_phone",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "z434i5dlb7",
          widgetName: "txt_dob",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "4hqs7tr225",
          widgetName: "txt_gender",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "6st25auvr3",
          widgetName: "div_detailDivider",
          type: "DIVIDER_WIDGET",
        },
        {
          widgetId: "jf6mghk92c",
          widgetName: "img_userImage",
          type: "IMAGE_WIDGET",
        },
      ],
    },
  ],
};
