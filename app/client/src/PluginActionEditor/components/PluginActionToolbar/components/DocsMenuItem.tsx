import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { createMessage, DOCUMENTATION } from "ee/constants/messages";
import { DocsLink, openDoc } from "constants/DocumentationLinks";
import { usePluginActionContext } from "../../../PluginActionContext";

export const DocsMenuItem = () => {
  const { plugin } = usePluginActionContext();
  const onDocsClick = useCallback(() => {
    openDoc(DocsLink.QUERY, plugin.documentationLink, plugin.name);
  }, [plugin]);

  if (!plugin.documentationLink) {
    return null;
  }

  return (
    <MenuItem
      className="t--datasource-documentation-link"
      onSelect={onDocsClick}
      startIcon="book-line"
    >
      {createMessage(DOCUMENTATION)}
    </MenuItem>
  );
};
