import {
  FetchSelectedAppThemeAction,
  FetchAppThemesAction,
  UpdateSelectedAppThemeAction,
  ChangeSelectedAppThemeAction,
} from "actions/appThemingActions";
import AppThemingApi from "api/AppThemingApi";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { AppTheme } from "entities/AppTheming";
import { all, takeLatest, select, put } from "redux-saga/effects";

const dummyThemes: AppTheme[] = [
  {
    name: "Default",
    created_at: "12/12/12",
    created_by: "@appsmith",
    config: {
      colors: {
        primaryColor: "#553DE9",
        secondaryColor: "#f00",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          DEFAULT: "0.25rem",
          md: "0.375rem",
          lg: "0.5rem",
          full: "9999px",
          xl: "0.75rem",
          "2xl": "1rem",
          "3xl": "1.5rem",
        },
        buttonBorderRadius: {
          none: "0px",
          md: "0.375rem",
          lg: "0.5rem",
        },
      },
      boxShadow: {
        appBoxShadow: {
          none: "none",
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          DEFAULT:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          md:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          lg:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
      fontFamily: {
        appFont: {
          roboto: ["'roboto san-seriff'", "http://googlrfont"],
        },
      },
    },
    stylesheet: {
      AUDIO_RECORDER_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      BUTTON_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      BUTTON_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      CHART_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      CHECKBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      CONTAINER_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      DATE_PICKER_WIDGET2: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      FILE_PICKER_WIDGET_V2: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      FORM_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      ICON_BUTTON_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      IFRAME_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      IMAGE_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      INPUT_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      LIST_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MAP_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MENU_BUTTON_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MODAL_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      },
      MULTI_SELECT_TREE_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MULTI_SELECT_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      DROPDOWN_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RADIO_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RICH_TEXT_EDITOR_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      STATBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      SWITCH_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      TABLE_WIDGET: {
        accentColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      TABS_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      TEXT_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      VIDEO_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      SINGLE_SELECT_TREE_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
    },
    properties: {
      colors: {
        primaryColor: "#553DE9",
        secondaryColor: "#EDE9FE",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: "0.375rem",
        buttonBorderRadius: "0.375rem",
      },
      boxShadow: {
        appBoxShadow: "none",
      },
      fontFamily: {
        appFont: ["'roboto san-seriff'", "http://googlrfont"],
      },
    },
    variants: {
      "Button.default.buttonColor": "{{appsmith.theme.colors.primary_colors}}",
    },
  },
  {
    name: "Sharp",
    created_at: "12/12/12",
    created_by: "@appsmith",
    config: {
      colors: {
        primaryColor: "#3B7DDD",
        secondaryColor: "#f00",
        backgroundColor: "#153D77",
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          DEFAULT: "0.25rem",
          md: "0.375rem",
          lg: "0.5rem",
          xl: "0.75rem",
          "2xl": "1rem",
          "3xl": "1.5rem",
          full: "9999px",
        },
        buttonBorderRadius: {
          none: "0px",
          md: "0.375rem",
          lg: "0.5rem",
        },
      },
      boxShadow: {
        appBoxShadow: {
          none: "none",
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          DEFAULT:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          md:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          lg:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
      fontFamily: {
        appFont: {
          roboto: ["'roboto san-seriff'", "http://googlrfont"],
        },
      },
    },
    stylesheet: {
      AUDIO_RECORDER_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      BUTTON_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      BUTTON_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      CHART_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      CHECKBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      CONTAINER_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      DATE_PICKER_WIDGET2: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      FILE_PICKER_WIDGET_V2: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      FORM_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      ICON_BUTTON_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      IFRAME_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      IMAGE_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      INPUT_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      LIST_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MAP_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MENU_BUTTON_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MODAL_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      },
      MULTI_SELECT_TREE_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MULTI_SELECT_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      DROPDOWN_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RADIO_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RICH_TEXT_EDITOR_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      STATBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      SWITCH_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      TABLE_WIDGET: {
        accentColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      TABS_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      TEXT_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      VIDEO_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      SINGLE_SELECT_TREE_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
    },
    properties: {
      colors: {
        primaryColor: "#3B7DDD",
        secondaryColor: "#fff",
        backgroundColor: "#153D77",
      },
      borderRadius: {
        appBorderRadius: "0px",
        buttonBorderRadius: "0.375rem",
      },
      boxShadow: {
        appBoxShadow: "none",
      },
      fontFamily: {
        appFont: ["'roboto san-seriff'", "http://googlrfont"],
      },
    },
    variants: {
      "Button.default.buttonColor": "{{appsmith.theme.colors.primary_colors}}",
    },
  },
  {
    name: "Rounded",
    created_at: "12/12/12",
    created_by: "@appsmith",
    config: {
      colors: {
        primaryColor: "#DE1593",
        secondaryColor: "#f00",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          DEFAULT: "0.25rem",
          md: "0.375rem",
          lg: "0.5rem",
          xl: "0.75rem",
          "2xl": "1rem",
          "3xl": "1.5rem",
          full: "9999px",
        },
        buttonBorderRadius: {
          none: "0px",
          md: "0.375rem",
          lg: "0.5rem",
        },
      },
      boxShadow: {
        appBoxShadow: {
          none: "none",
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          DEFAULT:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          md:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          lg:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
      fontFamily: {
        appFont: {
          roboto: ["'roboto san-seriff'", "http://googlrfont"],
        },
      },
    },
    stylesheet: {
      AUDIO_RECORDER_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      BUTTON_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      BUTTON_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      CHART_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      CHECKBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      CONTAINER_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      DATE_PICKER_WIDGET2: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      FILE_PICKER_WIDGET_V2: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      FORM_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      ICON_BUTTON_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      IFRAME_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      IMAGE_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      INPUT_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      LIST_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MAP_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MENU_BUTTON_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MODAL_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      },
      MULTI_SELECT_TREE_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      MULTI_SELECT_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      DROPDOWN_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RADIO_GROUP_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      RICH_TEXT_EDITOR_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      STATBOX_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      SWITCH_WIDGET: {
        backgroundColor: "{{appsmith.theme.colors.primaryColor}}",
      },
      TABLE_WIDGET: {
        accentColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      TABS_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      TEXT_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      VIDEO_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
      SINGLE_SELECT_TREE_WIDGET: {
        selectedTabColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.borderRadius.appBoxShadow}}",
      },
    },
    properties: {
      colors: {
        primaryColor: "#DE1593",
        secondaryColor: "#fff",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: "9999px",
        buttonBorderRadius: "0.375rem",
      },
      boxShadow: {
        appBoxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      fontFamily: {
        appFont: ["'roboto san-seriff'", "http://googlrfont"],
      },
    },
    variants: {
      "Button.default.buttonColor": "{{appsmith.theme.colors.primary_colors}}",
    },
  },
];

/**
 * fetches all themes of the application
 *
 * @param action
 */
export function* fetchAppThemes(action: ReduxAction<FetchAppThemesAction>) {
  const { applicationId } = action.payload;

  try {
    // const response = yield ThemingApi.fetchThemes(applicationId);

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
  const { applicationId } = action.payload;

  try {
    // const response = yield ThemingApi.fetchThemes(applicationId);

    yield put({
      type: ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
      payload: dummyThemes[0],
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
  const { applicationId, theme } = action.payload;

  try {
    // const response = yield ThemingApi.updateTheme(applicationId, theme);

    yield put({
      type: ReduxActionTypes.UPDATE_SELECTED_APP_THEME_SUCCESS,
      payload: theme,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_SELECTED_APP_THEME_ERROR,
      payload: { error },
    });
  }
}

/**
 * change the selected theme of the application
 *
 * @param action
 */
export function* changeSelectedTheme(
  action: ReduxAction<ChangeSelectedAppThemeAction>,
) {
  const { applicationId, theme } = action.payload;

  try {
    // const response = yield ThemingApi.updateTheme(applicationId, theme);

    yield put({
      type: ReduxActionTypes.CHANGE_SELECTED_APP_THEME_SUCCESS,
      payload: theme,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CHANGE_SELECTED_APP_THEME_ERROR,
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
    takeLatest(
      ReduxActionTypes.CHANGE_SELECTED_APP_THEME_INIT,
      updateSelectedTheme,
    ),
  ]);
}
