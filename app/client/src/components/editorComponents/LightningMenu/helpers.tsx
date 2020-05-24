import React from "react";
import { RestAction } from "api/ActionAPI";
import { Directions } from "utils/helpers";
import { WidgetProps } from "widgets/BaseWidget";
import CustomizedDropdown, {
  CustomizedDropdownOption,
} from "pages/common/CustomizedDropdown";

import {
  LIGHTNING_MENU_DATA_API,
  LIGHTNING_MENU_DATA_QUERY,
  LIGHTNING_MENU_DATA_WIDGET,
  LIGHTNING_MENU_OPTION_HTML,
  LIGHTNING_MENU_OPTION_JS,
  LIGHTNING_MENU_OPTION_TEXT,
} from "constants/messages";

export const getApiOptions = (
  themeType: string,
  apis: RestAction[],
  updatePropertyValue: (value: string, cursor?: number) => void,
) => ({
  sections: [
    // {
    //   isSticky: true,
    //   options: [
    //     {
    //       content: (
    //         <Button
    //           text="Create new API"
    //           icon="plus"
    //           iconAlignment="left"
    //           themeType={themeType}
    //           type="button"
    //         />
    //       ),
    //     },
    //   ],
    // },
    {
      options: apis.map(api => ({
        content: api.name,
        onSelect: () => {
          updatePropertyValue(`{{${api.name}.data}}`);
        },
      })),
    },
  ],
  trigger: {
    text: LIGHTNING_MENU_DATA_API,
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
  themeType: themeType,
});

export const getQueryOptions = (
  themeType: string,
  queries: RestAction[],
  updatePropertyValue: (value: string, cursor?: number) => void,
) => ({
  sections: [
    // {
    //   isSticky: true,
    //   options: [
    //     {
    //       content: (
    //         <Button
    //           text="Create new Query"
    //           icon="plus"
    //           iconAlignment="left"
    //           themeType={themeType}
    //           type="button"
    //         />
    //       ),
    //     },
    //   ],
    // },
    {
      options: queries.map(query => ({
        content: query.name,
        onSelect: () => {
          updatePropertyValue(`{{${query.name}.data}}`);
        },
      })),
    },
  ],
  trigger: {
    text: LIGHTNING_MENU_DATA_QUERY,
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
  themeType: themeType,
});

export const getWidgetOptions = (
  themeType: string,
  widgets: WidgetProps[],
  updatePropertyValue: (value: string, cursor?: number) => void,
) => ({
  sections: [
    {
      options: widgets.map(widget => ({
        content: widget.widgetName,
        disabled: false,
        shouldCloseDropdown: true,
        onSelect: () => {
          updatePropertyValue(`{{${widget.widgetName}.}}`);
        },
      })),
    },
  ],
  trigger: {
    text: LIGHTNING_MENU_DATA_WIDGET,
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
  themeType: themeType,
});

export const getLightningMenuOptions = (
  apis: RestAction[],
  queries: RestAction[],
  widgets: WidgetProps[],
  themeType: string,
  updatePropertyValue: (value: string, cursor?: number) => void,
) => {
  const options: CustomizedDropdownOption[] = [
    {
      content: LIGHTNING_MENU_OPTION_TEXT,
      disabled: false,
      shouldCloseDropdown: true,
      onSelect: () => {
        updatePropertyValue("");
      },
    },
  ];
  if (apis.length > 0) {
    options.push({
      content: (
        <CustomizedDropdown
          {...getApiOptions(themeType, apis, updatePropertyValue)}
        />
      ),
      disabled: false,
      shouldCloseDropdown: false,
    });
  }
  if (queries.length > 0) {
    options.push({
      content: (
        <CustomizedDropdown
          {...getQueryOptions(themeType, queries, updatePropertyValue)}
        />
      ),
      disabled: false,
      shouldCloseDropdown: false,
    });
  }
  if (widgets.length > 0) {
    options.push({
      content: (
        <CustomizedDropdown
          {...getWidgetOptions(themeType, widgets, updatePropertyValue)}
        />
      ),
      disabled: false,
      shouldCloseDropdown: false,
    });
  }
  return [
    ...options,
    {
      content: LIGHTNING_MENU_OPTION_JS,
      disabled: false,
      shouldCloseDropdown: true,
      onSelect: () => {
        updatePropertyValue("{{}}");
      },
    },
    {
      content: LIGHTNING_MENU_OPTION_HTML,
      disabled: false,
      shouldCloseDropdown: true,
      onSelect: () => {
        updatePropertyValue("<p></p>", 3);
      },
    },
  ];
};
