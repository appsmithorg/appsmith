import { AppState } from "@appsmith/reducers";
import { setSelectedPropertyPanel } from "actions/editorContextActions";
import {
  BaseItemProps,
  DroppableComponent,
  DroppableComponentProps,
} from "components/propertyControls/DraggableListComponent";
import React, { useRef } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedPropertyPanelIndex } from "selectors/editorContextSelectors";
import { selectFeatureFlags } from "selectors/usersSelectors";

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
  const currentIndex = useRef<number>(-1);
  const featureFlags = useSelector(selectFeatureFlags);
  const defaultPanelIndex = useSelector(
    (state: AppState) =>
      getSelectedPropertyPanelIndex(state, props.propertyName),
    (left: any, right: any) => {
      if (currentIndex.current !== left && left !== right) {
        return false;
      }
      return true;
    },
  );

  const { onEdit, propertyName } = props;

  useEffect(() => {
    featureFlags.CONTEXT_SWITCHING &&
      onEdit &&
      defaultPanelIndex !== undefined &&
      onEdit(defaultPanelIndex);
  }, [defaultPanelIndex]);

  const onPanelEdit = (index: number) => {
    if (onEdit) {
      currentIndex.current = index;
      onEdit(index);
      setTimeout(() => {
        dispatch(setSelectedPropertyPanel({ path: propertyName, index }));
      }, 0);
    }
  };

  return <DroppableComponent {...props} onEdit={onPanelEdit} />;
};
