import { AppState } from "@appsmith/reducers";
import { setSelectedPropertyPanel } from "actions/propertyPaneActions";
import {
  BaseItemProps,
  DroppableComponent,
  DroppableComponentProps,
} from "components/propertyControls/DraggableListComponent";
import debounce from "lodash/debounce";
import React, { useCallback } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedPropertyPanelIndex } from "selectors/propertyPaneSelectors";

export type DraggableListControlProps<
  TItem extends BaseItemProps
> = DroppableComponentProps<TItem> & {
  defaultPanelIndex?: number;
  propertyPath: string | undefined;
};
export const DraggableListControl = <TItem extends BaseItemProps>(
  props: DraggableListControlProps<TItem>,
) => {
  const dispatch = useDispatch();
  const defaultPanelIndex = useSelector((state: AppState) =>
    getSelectedPropertyPanelIndex(state, props.propertyPath),
  );

  const { onEdit, propertyPath } = props;

  //leading debounce to stop opening multiple panels
  const debouncedEditLeading = useCallback(
    debounce(
      (index: number) => {
        onEdit && onEdit(index);
      },
      300,
      {
        leading: true,
        trailing: false,
      },
    ),
    [],
  );

  useEffect(() => {
    onEdit &&
      defaultPanelIndex !== undefined &&
      debouncedEditLeading(defaultPanelIndex);
  }, [defaultPanelIndex]);

  const onPanelEdit = (index: number) => {
    if (onEdit) {
      debouncedEditLeading(index);
      dispatch(setSelectedPropertyPanel(propertyPath, index));
    }
  };

  return <DroppableComponent {...props} onEdit={onPanelEdit} />;
};
