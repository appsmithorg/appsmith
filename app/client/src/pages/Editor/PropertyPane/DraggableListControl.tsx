import { AppState } from "@appsmith/reducers";
import { setSelectedPropertyPanel } from "actions/editorContextActions";
import {
  DroppableComponent,
  BaseItemProps,
  DroppableComponentProps,
} from "components/ads/DraggableListComponent";
import React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedPropertyPanelIndex } from "selectors/editorContextSelectors";

export type DraggableListControlProps<
  TItem extends BaseItemProps
> = DroppableComponentProps<TItem> & {
  defaultPanelIndex?: number;
  propertyName: string;
};
export const DraggableListControl = <TItem extends BaseItemProps>(
  props: DraggableListControlProps<TItem>,
) => {
  const dispatch = useDispatch();
  let currentIndex = -1;
  const defaultPanelIndex = useSelector(
    (state: AppState) =>
      getSelectedPropertyPanelIndex(state, props.propertyName),
    (left: any, right: any) => {
      if (currentIndex !== left && left !== right) {
        return false;
      }
      return true;
    },
  );

  const { onEdit, propertyName } = props;

  useEffect(() => {
    onEdit && defaultPanelIndex !== undefined && onEdit(defaultPanelIndex);
  }, [defaultPanelIndex]);

  const onPanelEdit = (index: number) => {
    if (onEdit) {
      currentIndex = index;
      dispatch(setSelectedPropertyPanel({ path: propertyName, index }));
      onEdit(index);
    }
  };

  return <DroppableComponent {...props} onEdit={onPanelEdit} />;
};
