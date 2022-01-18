import React from "react";
import {
  FetchSelectedAppThemeAction,
  UpdateSelectedAppThemeAction,
} from "actions/appThemingActions";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { AppTheme } from "entities/AppTheming";
// import ThemingApi from "api/AppThemingApi";
import { all, takeLatest, put, select } from "redux-saga/effects";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { CHANGE_APP_THEME, createMessage } from "constants/messages";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { undoAction, updateReplayEntity } from "actions/pageActions";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import store from "store";
// import { getAppMode } from "selectors/applicationSelectors";
// import { APP_MODE } from "entities/App";

// eslint-disable-next-line
const dummyThemes: AppTheme[] = [
  {
    id: "classic",
    name: "Classic",
    created_at: "12/12/12",
    created_by: "@appsmith",
    config: {
      colors: {
        primaryColor: "#50AF6C",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          md: "0.375rem",
          lg: "1.5rem",
        },
      },
      boxShadow: {
        appBoxShadow: {
          none: "none",
          sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          md:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          lg:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
      fontFamily: {
        appFont: [
          "System Default",
          "Nunito Sans",
          "Poppins",
          "Inter",
          "Montserrat",
          "Noto Sans",
          "Open Sans",
          "Roboto",
          "Rubik",
          "Ubuntu",
        ],
      },
    },
    stylesheet: {
      AUDIO_RECORDER_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      BUTTON_GROUP_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CAMERA_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
      },
      CHART_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      CHECKBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CHECKBOX_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CONTAINER_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      DATE_PICKER_WIDGET2: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      FILE_PICKER_WIDGET_V2: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      FORM_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      FORM_BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      ICON_BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      IFRAME_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      IMAGE_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      INPUT_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      LIST_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      MAP_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      MENU_BUTTON_WIDGET: {
        menuColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MODAL_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MULTI_SELECT_TREE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MULTI_SELECT_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      DROP_DOWN_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      PROGRESSBAR_WIDGET: {
        fillColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      },
      RATE_WIDGET: {
        activeColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RADIO_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        boxShadow: "none",
      },
      RICH_TEXT_EDITOR_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      STATBOX_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      SWITCH_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        boxShadow: "none",
      },
      SWITCH_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      TABLE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      TABS_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      TEXT_WIDGET: {},
      VIDEO_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      SINGLE_SELECT_TREE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
    },
    properties: {
      colors: {
        primaryColor: "#50AF6C",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: "0px",
      },
      boxShadow: {
        appBoxShadow: "none",
      },
      fontFamily: {
        appFont: "System Default",
      },
    },
  },
  {
    id: "default",
    name: "Default",
    created_at: "12/12/12",
    created_by: "@appsmith",
    config: {
      colors: {
        primaryColor: "#553DE9",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          md: "0.375rem",
          lg: "1.5rem",
        },
      },
      boxShadow: {
        appBoxShadow: {
          none: "none",
          sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          md:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          lg:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
      fontFamily: {
        appFont: [
          "System Default",
          "Nunito Sans",
          "Poppins",
          "Inter",
          "Montserrat",
          "Noto Sans",
          "Open Sans",
          "Roboto",
          "Rubik",
          "Ubuntu",
        ],
      },
    },
    stylesheet: {
      AUDIO_RECORDER_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      BUTTON_GROUP_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CAMERA_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
      },
      CHART_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      CHECKBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CHECKBOX_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CONTAINER_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      DATE_PICKER_WIDGET2: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      FILE_PICKER_WIDGET_V2: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      FORM_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      FORM_BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      ICON_BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      IFRAME_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      IMAGE_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      INPUT_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      LIST_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      MAP_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      MENU_BUTTON_WIDGET: {
        menuColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MODAL_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MULTI_SELECT_TREE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MULTI_SELECT_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      DROP_DOWN_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      PROGRESSBAR_WIDGET: {
        fillColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      },
      RATE_WIDGET: {
        activeColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RADIO_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        boxShadow: "none",
      },
      RICH_TEXT_EDITOR_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      STATBOX_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      SWITCH_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        boxShadow: "none",
      },
      SWITCH_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      TABLE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      TABS_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      TEXT_WIDGET: {},
      VIDEO_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      SINGLE_SELECT_TREE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
    },
    properties: {
      colors: {
        primaryColor: "#553DE9",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: "0.375rem",
      },
      boxShadow: {
        appBoxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      },
      fontFamily: {
        appFont: "Nunito Sans",
      },
    },
  },
  {
    id: "sharp",
    name: "Sharp",
    created_at: "12/12/12",
    created_by: "@appsmith",
    config: {
      colors: {
        primaryColor: "#3B7DDD",
        backgroundColor: "#153D77",
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          md: "0.375rem",
          lg: "1.5rem",
        },
      },
      boxShadow: {
        appBoxShadow: {
          none: "none",
          sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          md:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          lg:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
      fontFamily: {
        appFont: [
          "System Default",
          "Nunito Sans",
          "Poppins",
          "Inter",
          "Montserrat",
          "Noto Sans",
          "Open Sans",
          "Roboto",
          "Rubik",
          "Ubuntu",
        ],
      },
    },
    stylesheet: {
      AUDIO_RECORDER_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      BUTTON_GROUP_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CAMERA_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
      },
      CHART_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      CHECKBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CHECKBOX_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CONTAINER_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      DATE_PICKER_WIDGET2: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      FILE_PICKER_WIDGET_V2: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      FORM_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      FORM_BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      ICON_BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      IFRAME_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      IMAGE_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      INPUT_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      LIST_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      MAP_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      MENU_BUTTON_WIDGET: {
        menuColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MODAL_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MULTI_SELECT_TREE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MULTI_SELECT_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      DROP_DOWN_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      PROGRESSBAR_WIDGET: {
        fillColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      },
      RATE_WIDGET: {
        activeColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RADIO_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        boxShadow: "none",
      },
      RICH_TEXT_EDITOR_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      STATBOX_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      SWITCH_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        boxShadow: "none",
      },
      SWITCH_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      TABLE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      TABS_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      TEXT_WIDGET: {},
      VIDEO_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      SINGLE_SELECT_TREE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
    },
    properties: {
      colors: {
        primaryColor: "#3B7DDD",
        backgroundColor: "#153D77",
      },
      borderRadius: {
        appBorderRadius: "0px",
      },
      boxShadow: {
        appBoxShadow: "none",
      },
      fontFamily: {
        appFont: "Roboto",
      },
    },
  },
  {
    id: "rounded",
    name: "Rounded",
    created_at: "12/12/12",
    created_by: "@appsmith",
    config: {
      colors: {
        primaryColor: "#DE1593",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          md: "0.375rem",
          lg: "1.5rem",
        },
      },
      boxShadow: {
        appBoxShadow: {
          none: "none",
          sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          md:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          lg:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
      fontFamily: {
        appFont: [
          "System Default",
          "Nunito Sans",
          "Poppins",
          "Inter",
          "Montserrat",
          "Noto Sans",
          "Open Sans",
          "Roboto",
          "Rubik",
          "Ubuntu",
        ],
      },
    },
    stylesheet: {
      AUDIO_RECORDER_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      BUTTON_GROUP_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CAMERA_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
      },
      CHART_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      CHECKBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CHECKBOX_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      CONTAINER_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      DATE_PICKER_WIDGET2: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      FILE_PICKER_WIDGET_V2: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      FORM_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      FORM_BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      ICON_BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      IFRAME_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      IMAGE_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      INPUT_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      LIST_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      MAP_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      MENU_BUTTON_WIDGET: {
        menuColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MODAL_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MULTI_SELECT_TREE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      MULTI_SELECT_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      DROP_DOWN_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
      PROGRESSBAR_WIDGET: {
        fillColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      },
      RATE_WIDGET: {
        activeColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RADIO_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        boxShadow: "none",
      },
      RICH_TEXT_EDITOR_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      STATBOX_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      SWITCH_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        boxShadow: "none",
      },
      SWITCH_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      TABLE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      TABS_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      TEXT_WIDGET: {},
      VIDEO_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      },
      SINGLE_SELECT_TREE_WIDGET: {
        primaryColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        boxShadow: "none",
      },
    },
    properties: {
      colors: {
        primaryColor: "#DE1593",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: "1.5rem",
      },
      boxShadow: {
        appBoxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      fontFamily: {
        appFont: "Roboto",
      },
    },
  },
];

/**
 * fetches all themes of the application
 *
 * @param action
 */
export function* fetchAppThemes() {
  try {
    // eslint-disable-next-line
    // const response = yield ThemingApi.fetchThemes();

    yield put({
      type: ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
      payload: dummyThemes,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
      payload: { error },
    });
  }
}

/**
 * fetches the selected theme of the application
 *
 * @param action
 */
export function* fetchAppSelectedTheme(
  action: ReduxAction<FetchSelectedAppThemeAction>,
) {
  // eslint-disable-next-line
  const { applicationId } = action.payload;
  // const mode: APP_MODE = yield select(getAppMode);

  try {
    // eslint-disable-next-line
    // const response = yield ThemingApi.fetchSelected(applicationId, mode);

    yield put({
      type: ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
      payload: dummyThemes[1],
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
      payload: { error },
    });
  }
}

/**
 * updates the selected theme of the application
 *
 * @param action
 */
export function* updateSelectedTheme(
  action: ReduxAction<UpdateSelectedAppThemeAction>,
) {
  // eslint-disable-next-line
  const { isNewThemeApplied, shouldReplay = true, theme } = action.payload;
  const canvasWidgets = yield select(getCanvasWidgets);

  try {
    yield put({
      type: ReduxActionTypes.UPDATE_SELECTED_APP_THEME_SUCCESS,
      payload: theme,
    });

    if (shouldReplay) {
      yield put(
        updateReplayEntity(
          "canvas",
          { widgets: canvasWidgets, theme },
          ENTITY_TYPE.WIDGET,
        ),
      );
    }

    if (isNewThemeApplied) {
      Toaster.show({
        text: createMessage(CHANGE_APP_THEME, theme.name),
        variant: Variant.success,
        actionElement: (
          <span onClick={() => store.dispatch(undoAction())}>Undo</span>
        ),
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_SELECTED_APP_THEME_ERROR,
      payload: { error },
    });
  }
}

export default function* appThemingSaga() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_APP_THEMES_INIT, fetchAppThemes),
    takeLatest(
      ReduxActionTypes.FETCH_SELECTED_APP_THEME_INIT,
      fetchAppSelectedTheme,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_SELECTED_APP_THEME_INIT,
      updateSelectedTheme,
    ),
  ]);
}
