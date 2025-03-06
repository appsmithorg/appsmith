import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { useDispatch } from "react-redux";
import { updatePageAction } from "actions/pageActions";

interface Props {
  pageId: string;
  pageName: string;
  disabled?: boolean;
  isHidden?: boolean;
}

export const Visibility = ({ disabled, isHidden, pageId, pageName }: Props) => {
  const dispatch = useDispatch();
  const setHiddenField = useCallback(() => {
    dispatch(
      updatePageAction({
        id: pageId,
        name: pageName,
        isHidden: !isHidden,
      }),
    );
  }, [dispatch, pageId, pageName, isHidden]);

  return (
    <MenuItem
      disabled={disabled}
      onSelect={setHiddenField}
      startIcon={isHidden ? "eye-on" : "eye-off"}
    >
      <div className="flex items-center justify-between w-full">
        <span>{isHidden ? "Show" : "Hide"}</span>
      </div>
    </MenuItem>
  );
};
