import type { ListItemProps } from "@appsmith/ads";
import { useSelector } from "react-redux";
import {
  getJSSegmentItems,
  getQuerySegmentItems,
  getUISegmentItems,
} from "ee/selectors/entitiesSelector";
import { useState } from "react";
import type { GenericEntityItem } from "ee/entities/IDE/constants";
import { GlobeIcon } from "pages/Editor/Explorer/ExplorerIcons";

export const useStateInspectorItems: () => [
  GenericEntityItem,
  {
    group: string;
    items: ListItemProps[];
  }[],
] = () => {
  const [selectedItem, setSelectedItem] = useState<GenericEntityItem>({
    key: "appsmith",
    title: "appsmith",
  });
  const queries = useSelector(getQuerySegmentItems);

  const queryItems: ListItemProps[] = queries.map((query) => ({
    id: query.key,
    title: query.title,
    startIcon: query.icon,
    isSelected: selectedItem.key === query.key,
    onClick: () => setSelectedItem(query),
    description: "",
    descriptionType: "inline",
    size: "md",
  }));

  const jsObjects = useSelector(getJSSegmentItems);

  const jsItems: ListItemProps[] = jsObjects.map((jsObject) => ({
    id: jsObject.key,
    title: jsObject.title,
    startIcon: jsObject.icon,
    isSelected: selectedItem.key === jsObject.key,
    onClick: () => setSelectedItem(jsObject),
    description: "",
    descriptionType: "inline",
    size: "md",
  }));

  const widgets = useSelector(getUISegmentItems);

  const widgetItems: ListItemProps[] = widgets.map((widget) => ({
    id: widget.key,
    title: widget.title,
    startIcon: widget.icon,
    isSelected: selectedItem.key === widget.key,
    onClick: () => setSelectedItem(widget),
    description: "",
    descriptionType: "inline",
    size: "md",
  }));

  return [
    selectedItem,
    [
      {
        group: "Queries",
        items: queryItems,
      },
      {
        group: "JS objects",
        items: jsItems,
      },
      {
        group: "UI elements",
        items: widgetItems,
      },
      {
        group: "Globals",
        items: [
          {
            id: "appsmith",
            startIcon: GlobeIcon(),
            title: "appsmith",
            isSelected: selectedItem.key === "appsmith",
            onClick: () =>
              setSelectedItem({ key: "appsmith", title: "appsmith" }),
            description: "",
            descriptionType: "inline",
            size: "md",
          },
        ],
      },
    ],
  ];
};
