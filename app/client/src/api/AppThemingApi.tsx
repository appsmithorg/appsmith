import API from "api/Api";
import type { AxiosPromise } from "axios";
import type { AppTheme } from "entities/AppTheming";
import type { ApiResponse } from "./ApiResponses";

class AppThemingApi extends API {
  static baseUrl = "/v1";

  /**
   * fires api to get all themes
   *
   * @returns
   */
  static async fetchThemes(
    applicationId: string,
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    // api/v1/themes/applications/657ad510e4a5e56691a2f866
    // eslint-disable-next-line no-console
    console.log("applicationId ", applicationId);
    return {
      responseMeta: {
        status: 200,
        success: true,
      },
      data: [
        {
          id: "657ad3f0e4a5e56691a2f84f",
          userPermissions: ["read:themes"],
          name: "Default-New",
          displayName: "Modern",
          config: {
            order: 1.0,
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
          properties: {
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
            },
            borderRadius: {
              appBorderRadius: "0.375rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            },
            fontFamily: {
              appFont: "System Default",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                editActions: {
                  saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  saveBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  discardBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
              },
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "657ad3f0e4a5e56691a2f850",
          userPermissions: ["read:themes"],
          name: "Classic",
          displayName: "Classic",
          config: {
            order: 2.0,
            colors: {
              primaryColor: "#16a34a",
              backgroundColor: "#F6F6F6",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
          properties: {
            colors: {
              primaryColor: "#16a34a",
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
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                editActions: {
                  saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  saveBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  discardBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
              },
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "657ad3f0e4a5e56691a2f851",
          userPermissions: ["read:themes"],
          name: "Sunrise",
          displayName: "Sunrise",
          config: {
            order: 3.0,
            colors: {
              primaryColor: "#ef4444",
              backgroundColor: "#fff1f2",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
          properties: {
            colors: {
              primaryColor: "#ef4444",
              backgroundColor: "#fff1f2",
            },
            borderRadius: {
              appBorderRadius: "1.5rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
            fontFamily: {
              appFont: "Rubik",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                editActions: {
                  saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  saveBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  discardBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
              },
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "657ad3f0e4a5e56691a2f852",
          userPermissions: ["read:themes"],
          name: "Rounded",
          displayName: "Water Lily",
          config: {
            order: 4.0,
            colors: {
              primaryColor: "#db2777",
              backgroundColor: "#fdf2f8",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
          properties: {
            colors: {
              primaryColor: "#db2777",
              backgroundColor: "#fdf2f8",
            },
            borderRadius: {
              appBorderRadius: "1.5rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
            fontFamily: {
              appFont: "Rubik",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                editActions: {
                  saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  saveBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  discardBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
              },
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "657ad3f0e4a5e56691a2f853",
          userPermissions: ["read:themes"],
          name: "Pacific",
          displayName: "Pacific",
          config: {
            order: 5.0,
            colors: {
              primaryColor: "#0891b2",
              backgroundColor: "#ecfeff",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
          properties: {
            colors: {
              primaryColor: "#0891b2",
              backgroundColor: "#ecfeff",
            },
            borderRadius: {
              appBorderRadius: "1.5rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
            fontFamily: {
              appFont: "Open Sans",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                editActions: {
                  saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  saveBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  discardBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
              },
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "657ad3f0e4a5e56691a2f854",
          userPermissions: ["read:themes"],
          name: "Earth",
          displayName: "Earth",
          config: {
            order: 6.0,
            colors: {
              primaryColor: "#3b82f6",
              backgroundColor: "#eff6ff",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
          properties: {
            colors: {
              primaryColor: "#3b82f6",
              backgroundColor: "#eff6ff",
            },
            borderRadius: {
              appBorderRadius: "0.375rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            },
            fontFamily: {
              appFont: "Inter",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                editActions: {
                  saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  saveBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  discardBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
              },
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "657ad3f0e4a5e56691a2f855",
          userPermissions: ["read:themes"],
          name: "Pampas",
          displayName: "Pampas",
          config: {
            order: 7.0,
            colors: {
              primaryColor: "#059669",
              backgroundColor: "#ecfdf5",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
          properties: {
            colors: {
              primaryColor: "#059669",
              backgroundColor: "#ecfdf5",
            },
            borderRadius: {
              appBorderRadius: "0.375rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            },
            fontFamily: {
              appFont: "Nunito Sans",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                editActions: {
                  saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  saveBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  discardBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
              },
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "657ad3f0e4a5e56691a2f856",
          userPermissions: ["read:themes"],
          name: "Sharp",
          displayName: "Moon",
          config: {
            order: 8.0,
            colors: {
              primaryColor: "#64748b",
              backgroundColor: "#f8fafc",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
          properties: {
            colors: {
              primaryColor: "#64748b",
              backgroundColor: "#f8fafc",
            },
            borderRadius: {
              appBorderRadius: "0px",
            },
            boxShadow: {
              appBoxShadow: "none",
            },
            fontFamily: {
              appFont: "Nunito Sans",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                editActions: {
                  saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  saveBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  discardBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
              },
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "657ad3f0e4a5e56691a2f857",
          userPermissions: ["read:themes"],
          name: "Default",
          displayName: "Modern",
          config: {
            order: 9.0,
            isDeprecated: true,
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
          properties: {
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
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
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                editActions: {
                  saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  saveBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                  discardBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
              },
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
      ],
      errorDisplay: "",
    };
  }

  /**
   * fires api to fetch selected theme
   *
   * @param applicationId
   * @returns
   */
  static async fetchSelected(
    applicationId: string,
    mode = "EDIT",
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    // themes/applications/657ad510e4a5e56691a2f866/current?mode=EDIT
    // eslint-disable-next-line no-console
    console.log(" applicationId: string, mode ", applicationId, mode);
    return {
      responseMeta: {
        status: 200,
        success: true,
      },
      data: {
        id: "657ad3f0e4a5e56691a2f84f",
        userPermissions: ["read:themes"],
        name: "Default-New",
        displayName: "Modern",
        config: {
          order: 1.0,
          colors: {
            primaryColor: "#553DE9",
            backgroundColor: "#F8FAFC",
          },
          borderRadius: {
            appBorderRadius: {
              none: "0px",
              M: "0.375rem",
              L: "1.5rem",
            },
          },
          boxShadow: {
            appBoxShadow: {
              none: "none",
              S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
              M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
        properties: {
          colors: {
            primaryColor: "#553DE9",
            backgroundColor: "#F8FAFC",
          },
          borderRadius: {
            appBorderRadius: "0.375rem",
          },
          boxShadow: {
            appBoxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          },
          fontFamily: {
            appFont: "System Default",
          },
        },
        stylesheet: {
          AUDIO_RECORDER_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          BUTTON_WIDGET: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          BUTTON_GROUP_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
            childStylesheet: {
              button: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              },
            },
          },
          CAMERA_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          CHART_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
          },
          CHECKBOX_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          CHECKBOX_GROUP_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          CONTAINER_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          CIRCULAR_PROGRESS_WIDGET: {
            fillColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          CURRENCY_INPUT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          PHONE_INPUT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          DATE_PICKER_WIDGET2: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          FILE_PICKER_WIDGET_V2: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          FORM_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          FORM_BUTTON_WIDGET: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          ICON_BUTTON_WIDGET: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          IFRAME_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          IMAGE_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          INPUT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          INPUT_WIDGET_V2: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          JSON_FORM_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            submitButtonStyles: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            resetButtonStyles: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            childStylesheet: {
              ARRAY: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
                cellBorderRadius:
                  "{{appsmith.theme.borderRadius.appBorderRadius}}",
                cellBoxShadow: "none",
              },
              OBJECT: {
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
                cellBorderRadius:
                  "{{appsmith.theme.borderRadius.appBorderRadius}}",
                cellBoxShadow: "none",
              },
              CHECKBOX: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              },
              CURRENCY_INPUT: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              DATEPICKER: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              EMAIL_INPUT: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              MULTISELECT: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              MULTILINE_TEXT_INPUT: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              NUMBER_INPUT: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              PASSWORD_INPUT: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              PHONE_NUMBER_INPUT: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              RADIO_GROUP: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                boxShadow: "none",
              },
              SELECT: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              SWITCH: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                boxShadow: "none",
              },
              TEXT_INPUT: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
            },
          },
          LIST_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          MAP_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          MAP_CHART_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
          },
          MENU_BUTTON_WIDGET: {
            menuColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          MODAL_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          MULTI_SELECT_TREE_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          MULTI_SELECT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          MULTI_SELECT_WIDGET_V2: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          DROP_DOWN_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          PROGRESSBAR_WIDGET: {
            fillColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          PROGRESS_WIDGET: {
            fillColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          CODE_SCANNER_WIDGET: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          RATE_WIDGET: {
            activeColor: "{{appsmith.theme.colors.primaryColor}}",
          },
          RADIO_GROUP_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            boxShadow: "none",
          },
          RICH_TEXT_EDITOR_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          STATBOX_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          SWITCH_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            boxShadow: "none",
          },
          SWITCH_GROUP_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
          },
          SELECT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          TABLE_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            childStylesheet: {
              button: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              menuButton: {
                menuColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              iconButton: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
            },
          },
          TABLE_WIDGET_V2: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            childStylesheet: {
              button: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              menuButton: {
                menuColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              iconButton: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              editActions: {
                saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                saveBorderRadius:
                  "{{appsmith.theme.borderRadius.appBorderRadius}}",
                discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                discardBorderRadius:
                  "{{appsmith.theme.borderRadius.appBorderRadius}}",
              },
            },
          },
          TABS_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          TEXT_WIDGET: {
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          VIDEO_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          SINGLE_SELECT_TREE_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          CATEGORY_SLIDER_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
          },
          NUMBER_SLIDER_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
          },
          RANGE_SLIDER_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
          },
        },
        new: false,
        isSystemTheme: true,
      },
      errorDisplay: "",
    };
  }

  /**
   * fires api to updating current theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static async updateTheme(
    applicationId: string,
    theme: AppTheme,
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    return API.put(
      `${AppThemingApi.baseUrl}/themes/applications/${applicationId}`,
      theme,
    );
  }

  /**
   * fires api to updating current theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static async changeTheme(
    applicationId: string,
    theme: AppTheme,
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    return API.patch(
      `${AppThemingApi.baseUrl}/applications/${applicationId}/themes/${theme.id}`,
      theme,
    );
  }

  /**
   * fires api for saving current theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static async saveTheme(
    applicationId: string,
    payload: { name: string },
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    return API.patch(
      `${AppThemingApi.baseUrl}/themes/applications/${applicationId}`,
      payload,
    );
  }

  /**
   * fires api for deleting theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static async deleteTheme(
    themeId: string,
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    return API.delete(`${AppThemingApi.baseUrl}/themes/${themeId}`);
  }
}

export default AppThemingApi;
