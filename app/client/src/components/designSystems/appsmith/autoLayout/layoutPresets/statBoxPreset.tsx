/* eslint-disable no-console */
import React, { useEffect } from "react";
import type {
  LayoutComponentProps,
  LayoutConfig,
  LayoutPreset,
} from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "../layoutComponents/FlexLayout";
import { buildPreset } from "utils/autoLayout/layoutCondensationUtils";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import {
  getLayoutConfigById,
  getLayoutConfigForPreset,
} from "selectors/layoutSelectors";
import { renderLayouts } from "utils/autoLayout/layoutComponentUtils";

const StatBoxPreset = (props: LayoutPreset) => {
  const config: LayoutConfig | null = useSelector((state: AppState) =>
    getLayoutConfigById(state, props.layoutId),
  );
  const childConfigs: LayoutComponentProps[] | null = useSelector(
    (state: AppState) => getLayoutConfigForPreset(state, props.layoutId),
  );
  const { childrenMap, containerProps } = props;

  useEffect(() => {
    if (config === null) {
      console.log("#### build preset", { config });
      buildPreset(props, [...StatBoxPreset.template]);
    }
  }, []);

  if (!containerProps || !config || !childConfigs) return null;
  return (
    <FlexLayout
      canvasId={containerProps.widgetId}
      columnGap={4}
      flexDirection="row"
      flexWrap="wrap-reverse"
      layoutId={props.layoutId}
    >
      {renderLayouts(childConfigs, childrenMap, containerProps)}
    </FlexLayout>
  );
};

StatBoxPreset.template = [
  {
    isDropTarget: true,
    childTemplate: {
      layoutId: "",
      layoutStyle: {
        columnGap: 4,
        alignSelf: "stretch",
      },
      layoutType: "ROW",
      layout: [],
      insertChild: true,
      rendersWidgets: true,
      canBeDeleted: true,
    },
    layoutId: "",
    layoutStyle: {
      rowGap: 12,
      flexGrow: 2,
      border: "1px dashed #979797",
      padding: 4,
    },
    layoutType: "COLUMN",
    layout: [],
  },
  {
    isDropTarget: true,
    layoutId: "",
    layoutStyle: {
      rowGap: 12,
      border: "1px dashed #979797",
      padding: 4,
    },
    layoutType: "COLUMN",
    layout: [],
    rendersWidgets: true,
  },
];

export default StatBoxPreset;
