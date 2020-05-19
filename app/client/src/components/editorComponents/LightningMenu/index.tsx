import React from "react";
import CustomizedDropdown, {
  CustomizedDropdownProps,
} from "pages/common/CustomizedDropdown";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import Button from "components/editorComponents/Button";
import { Directions } from "utils/helpers";
import { RestAction } from "api/ActionAPI";
import { noop } from "lodash";

const getApiOptions = (apis: RestAction[]) => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: (
            <Button text="Create new API" icon="plus" iconAlignment="left" />
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
    text: "Use data from API",
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
});

const getQueryOptions = (queries: RestAction[]) => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: (
            <Button text="Create new Query" icon="plus" iconAlignment="left" />
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
    text: "Use data from Query",
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
});

const lightningMenuOptions = (
  apis: RestAction[],
  queries: RestAction[],
  updatePropertyValue: (value: string) => void,
): CustomizedDropdownProps => ({
  sections: [
    {
      options: [
        {
          content: "PlainText/HTML/JS",
          disabled: false,
          shouldCloseDropdown: true,
          onSelect: () => {
            updatePropertyValue("test");
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
      ],
    },
  ],
  openDirection: Directions.DOWN,
  usePortal: true,
  trigger: {
    text: "",
  },
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
  const apis = actions
    .filter(action => action.config.pluginType === "API")
    .map(action => action.config);
  const queries = actions
    .filter(action => action.config.pluginType === "DB")
    .map(action => action.config);

  return (
    <CustomizedDropdown
      {...lightningMenuOptions(apis, queries, props.updatePropertyValue)}
    />
  );
};

export default LightningMenu;
