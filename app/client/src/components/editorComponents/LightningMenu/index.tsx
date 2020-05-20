import React from "react";
import CustomizedDropdown, {
  CustomizedDropdownProps,
} from "pages/common/CustomizedDropdown";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import Button from "components/editorComponents/Button";
import { Directions } from "utils/helpers";
import { RestAction } from "api/ActionAPI";
import { WidgetProps } from "widgets/BaseWidget";
import { noop } from "lodash";

const getApiOptions = (apis: RestAction[]) => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: (
            <Button
              text="Create new API"
              icon="plus"
              iconAlignment="left"
              themeType="dark"
            />
          ),
        },
      ],
    },
    {
      options: apis.map(api => ({
        content: api.name,
        onSelect: noop,
      })),
    },
  ],
  trigger: {
    text: "Use data from a API",
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
  themeType: "dark",
});

const getQueryOptions = (queries: RestAction[]) => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: (
            <Button
              text="Create new Query"
              icon="plus"
              iconAlignment="left"
              themeType="dark"
            />
          ),
        },
      ],
    },
    {
      options: queries.map(query => ({
        content: query.name,
        onSelect: noop,
      })),
    },
  ],
  trigger: {
    text: "Use data from a Query",
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
  themeType: "dark",
});

const getWidgetOptions = (
  widgets: WidgetProps[],
  updatePropertyValue: (value: string) => void,
) => ({
  sections: [
    // {
    //   isSticky: true,
    //   options: [
    //     {
    //       content: (
    //         <Button
    //           text="Create new widget"
    //           icon="plus"
    //           iconAlignment="left"
    //           themeType="dark"
    //         />
    //       ),
    //     },
    //   ],
    // },
    {
      options: widgets.map(widget => ({
        content: (
          <CustomizedDropdown {...getWidgetData(widget, updatePropertyValue)} />
        ),
        disabled: false,
        shouldCloseDropdown: false,
      })),
    },
  ],
  trigger: {
    text: "Use data from a Widget",
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
  themeType: "dark",
});

const getWidgetData = (
  widget: WidgetProps,
  updatePropertyValue: (value: string) => void,
) => ({
  sections: [
    {
      options: Object.keys(widget).map(widgetProp => ({
        content: widgetProp,
        onSelect: () => {
          updatePropertyValue(`{{${widget.widgetName}.${widgetProp}}}`);
        },
      })),
    },
  ],
  trigger: {
    text: widget.widgetName,
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
  themeType: "dark",
});

const lightningMenuOptions = (
  apis: RestAction[],
  queries: RestAction[],
  widgets: WidgetProps[],
  updatePropertyValue: (value: string) => void,
): CustomizedDropdownProps => ({
  sections: [
    {
      options: [
        {
          content: "Plain Text",
          disabled: false,
          shouldCloseDropdown: true,
          onSelect: () => {
            updatePropertyValue("Plain Text");
          },
        },
        {
          content: <CustomizedDropdown {...getApiOptions(apis)} />,
          disabled: false,
          shouldCloseDropdown: false,
        },
        {
          content: <CustomizedDropdown {...getQueryOptions(queries)} />,
          disabled: false,
          shouldCloseDropdown: false,
        },
        {
          content: (
            <CustomizedDropdown
              {...getWidgetOptions(widgets, updatePropertyValue)}
            />
          ),
          disabled: false,
          shouldCloseDropdown: false,
        },
        {
          content: "JS",
          disabled: false,
          shouldCloseDropdown: true,
          onSelect: () => {
            updatePropertyValue("{{}}");
          },
        },
        {
          content: "HTML",
          disabled: false,
          shouldCloseDropdown: true,
          onSelect: () => {
            updatePropertyValue("<p></p>");
          },
        },
      ],
    },
  ],
  openDirection: Directions.DOWN,
  usePortal: true,
  trigger: {
    text: "",
  },
  themeType: "dark",
});

type LightningMenuProps = {
  onSelect?: (value: string) => void;
  updatePropertyValue: (value: string) => void;
};

export const LightningMenu = (props: LightningMenuProps) => {
  const actions = useSelector((state: AppState) => {
    const currentPageId = state.entities.pageList.currentPageId;
    return state.entities.actions.filter(
      action => action.config.pageId === currentPageId,
    );
  });
  const widgets = useSelector((state: AppState) => {
    const canvasWidgets = [];
    for (const i in state.entities.canvasWidgets) {
      if (
        !["CONTAINER_WIDGET", "CANVAS_WIDGET"].includes(
          state.entities.canvasWidgets[i].type,
        )
      ) {
        canvasWidgets.push(state.entities.canvasWidgets[i]);
      }
    }
    return canvasWidgets;
  });
  console.log("widgets", widgets);
  const apis = actions
    .filter(action => action.config.pluginType === "API")
    .map(action => action.config);
  const queries = actions
    .filter(action => action.config.pluginType === "DB")
    .map(action => action.config);

  return (
    <CustomizedDropdown
      {...lightningMenuOptions(
        apis,
        queries,
        widgets,
        props.updatePropertyValue,
      )}
    />
  );
};

export default LightningMenu;
