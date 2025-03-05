import React from "react";
import { useAppsmithTable } from "../../TableContext";
import { AddNewRowBanner } from "./AddNewRowBanner";

function BannerComponent() {
  const {
    accentColor,
    borderRadius,
    boxShadow,
    disabledAddNewRowSave,
    onAddNewRowAction,
  } = useAppsmithTable();

  return (
    <AddNewRowBanner
      accentColor={accentColor}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      disabledAddNewRowSave={disabledAddNewRowSave}
      onAddNewRowAction={onAddNewRowAction}
    />
  );
}

export const Banner = React.memo(BannerComponent);
