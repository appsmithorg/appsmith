import React from "react";
import type { ActionsPropsType } from "./actions";
import { Actions } from "./actions";
import type { BannerPropType } from "./banner";
import { Banner } from "./banner";

interface TableHeaderProps extends ActionsPropsType, BannerPropType {
  isAddRowInProgress: boolean;
}

function TableHeader(props: TableHeaderProps) {
  const {
    disabledAddNewRowSave,
    isAddRowInProgress,
    onAddNewRowAction,
    ...ActionProps
  } = props;

  return isAddRowInProgress ? (
    <Banner
      disabledAddNewRowSave={disabledAddNewRowSave}
      onAddNewRowAction={onAddNewRowAction}
    />
  ) : (
    <Actions {...ActionProps} />
  );
}

export default TableHeader;
