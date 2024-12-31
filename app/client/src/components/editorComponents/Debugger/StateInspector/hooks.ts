import type { ListItemProps } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import {
  getJSSegmentItems,
  getQuerySegmentItems,
  getUISegmentItems,
} from "ee/selectors/entitiesSelector";
import type { GenericEntityItem } from "ee/entities/IDE/constants";
import { GlobeIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { setDebuggerStateInspectorSelectedItem } from "actions/debuggerActions";
import { getDebuggerStateInspectorSelectedItem } from "selectors/debuggerSelectors";
import { useEffect } from "react";

export const useStateInspectorItems: () => [
  GenericEntityItem,
  {
    group: string;
    items: ListItemProps[];
  }[],
] = () => {
  const dispatch = useDispatch();

  const setSelectedItem = (item: GenericEntityItem) => {
    dispatch(setDebuggerStateInspectorSelectedItem(item));
  };

  const selectedItem = useSelector(getDebuggerStateInspectorSelectedItem) || {
    key: "",
    title: "",
  };

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
    className: "query-item",
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

  const globalItem = {
    key: "appsmith",
    title: "appsmith",
    icon: GlobeIcon(),
  };

  const groups: { group: string; items: ListItemProps[] }[] = [
    {
      group: "Globals",
      items: [
        {
          id: globalItem.key,
          startIcon: globalItem.icon,
          title: globalItem.title,
          isSelected: selectedItem.key === globalItem.key,
          onClick: () => setSelectedItem(globalItem),
          description: "",
          descriptionType: "inline",
          size: "md",
        },
      ],
    },
  ];

  if (widgetItems.length) {
    groups.unshift({
      group: "UI elements",
      items: widgetItems,
    });
  }

  if (jsItems.length) {
    groups.unshift({
      group: "JS objects",
      items: jsItems,
    });
  }

  if (queryItems.length) {
    groups.unshift({
      group: "Queries",
      items: queryItems,
    });
  }

  useEffect(() => {
    if (selectedItem.key === "") {
      const firstItem = groups[0].items[0];

      if (firstItem.id) {
        setSelectedItem({
          key: firstItem.id,
          title: firstItem.title,
          icon: firstItem.startIcon,
        });
      } else {
        setSelectedItem(globalItem);
      }
    }
  }, [groups, selectedItem, setSelectedItem]);

  return [selectedItem, groups];
};
