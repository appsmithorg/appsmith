import React from "react";
import Actions from "./actions";
import { Banner } from "./banner";
import { useAppsmithTable } from "../TableContext";

function BannerNActions() {
  const { isAddRowInProgress } = useAppsmithTable();

  return isAddRowInProgress ? <Banner /> : <Actions />;
}

export default BannerNActions;
