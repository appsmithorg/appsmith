import type { Page } from "entities/Page";
import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";

export const PageMenuItem = (props: {
  page: Page;
  onSelect: (id: string) => void;
}) => {
  const handleOnSelect = useCallback(() => {
    props.onSelect(props.page.pageId);
  }, [props]);

  return <MenuItem onSelect={handleOnSelect}>{props.page.pageName}</MenuItem>;
};
