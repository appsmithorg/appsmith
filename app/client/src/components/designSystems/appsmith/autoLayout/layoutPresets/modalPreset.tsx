/* eslint-disable no-console */
import React, { useEffect } from "react";

import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import type {
  LayoutComponentProps,
  LayoutConfig,
  LayoutPreset,
} from "utils/autoLayout/autoLayoutTypes";
import {
  getLayoutConfigById,
  getLayoutConfigForPreset,
} from "selectors/layoutSelectors";
import { buildPreset } from "utils/autoLayout/layoutCondensationUtils";
import FlexLayout from "../layoutComponents/FlexLayout";
import { renderLayouts } from "utils/autoLayout/layoutComponentUtils";

const ModalPreset = (props: LayoutPreset) => {
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
      buildPreset(props, [...ModalPreset.template]);
    }
  }, []);

  if (!containerProps || !config || !childConfigs) return null;
  console.log("####", { childConfigs });
  return (
    <FlexLayout
      canvasId={containerProps.widgetId}
      flexDirection="column"
      layoutId={props.layoutId}
      padding={4}
      rowGap={12}
    >
      <FlexLayout
        alignSelf="stretch"
        canvasId={containerProps.widgetId}
        columnGap={4}
        flexDirection="row"
        layoutId={props.layoutId}
      >
        {renderLayouts(
          [childConfigs[0], childConfigs[1]],
          childrenMap,
          containerProps,
        )}
      </FlexLayout>
      <FlexLayout
        alignSelf="stretch"
        canvasId={containerProps.widgetId}
        columnGap={4}
        flexDirection="row"
        flexWrap="wrap"
        height="auto"
        layoutId={props.layoutId}
        maxHeight="300px"
        overflow="auto"
      >
        {renderLayouts([childConfigs[2]], childrenMap, containerProps)}
      </FlexLayout>
      {renderLayouts([childConfigs[3]], childrenMap, containerProps)}
    </FlexLayout>
  );
};

ModalPreset.template = [
  {
    layoutId: "",
    layoutStyle: {
      columnGap: 4,
      flexGrow: 1,
      border: "1px dashed #979797",
      minHeight: 40,
    },
    layoutType: "ROW",
    isDropTarget: true,
    widgetsAllowed: ["TEXT_WIDGET"],
    layout: [],
    rendersWidgets: true,
  },
  {
    layoutId: "",
    layoutStyle: {
      columnGap: 4,
      minWidth: "30px",
      border: "1px dashed #979797",
      minHeight: 40,
    },
    layoutType: "ROW",
    isDropTarget: true,
    widgetsAllowed: ["ICON_BUTTON_WIDGET"],
    layout: [],
    rendersWidgets: true,
  },
  {
    childTemplate: {
      canBeDeleted: true,
      insertChild: true,
      layoutId: "",
      layoutType: "ALIGNED_ROW",
      layoutStyle: {
        alignSelf: "stretch",
        columnGap: 4,
        rowGap: 12,
      },
      layout: [[], [], []], //string[][]
      rendersWidgets: true,
    },
    isDropTarget: true,
    layoutId: "",
    layoutStyle: {
      minWidth: "220px",
      minHeight: 40,
      rowGap: 12,
      flexGrow: 3,
      border: "1px dashed #979797",
    },
    layoutType: "ALIGNED_COLUMN",
    layout: [
      {
        canBeDeleted: true,
        layoutId: "",
        layoutStyle: {
          alignSelf: "stretch",
          columnGap: 4,
          rowGap: 12,
        },
        layoutType: "ALIGNED_ROW",
        layout: [[], [], []],
        rendersWidgets: true,
      },
    ],
  },
  {
    isDropTarget: true,
    layoutId: "",
    layoutStyle: {
      alignSelf: "stretch",
      border: "1px dashed #979797",
      minHeight: 40,
    },
    layoutType: "ALIGNED_ROW",
    layout: [[], [], []],
    rendersWidgets: true,
  },
];

export default ModalPreset;
