import { useDispatch, useSelector } from "react-redux";
import { getPageList } from "ee/selectors/entitiesSelector";
import { usePluginActionContext } from "PluginActionEditor";
import React, { useCallback } from "react";
import { copyActionRequest } from "actions/pluginActionActions";
import { MenuSub, MenuSubContent, MenuSubTrigger } from "@appsmith/ads";
import { CONTEXT_COPY, createMessage } from "ee/constants/messages";
import { PageMenuItem } from "./PageMenuItem";

interface Props {
  disabled?: boolean;
}

export const Copy = ({ disabled }: Props) => {
  const menuPages = useSelector(getPageList);
  const { action } = usePluginActionContext();
  const dispatch = useDispatch();

  const copyActionToPage = useCallback(
    (pageId: string) =>
      dispatch(
        copyActionRequest({
          id: action.id,
          destinationPageId: pageId,
          name: action.name,
        }),
      ),
    [action.id, action.name, dispatch],
  );

  return (
    <MenuSub>
      <MenuSubTrigger disabled={disabled} startIcon="duplicate">
        {createMessage(CONTEXT_COPY)}
      </MenuSubTrigger>
      <MenuSubContent>
        {menuPages.map((page) => {
          return (
            <PageMenuItem
              key={page.basePageId}
              onSelect={copyActionToPage}
              page={page}
            />
          );
        })}
      </MenuSubContent>
    </MenuSub>
  );
};
