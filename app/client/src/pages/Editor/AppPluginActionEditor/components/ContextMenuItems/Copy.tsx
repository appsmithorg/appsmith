import React from "react";
import { MenuSub, MenuSubContent, MenuSubTrigger } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { getPageList } from "selectors/editorSelectors";
import { PageMenuItem } from "./PageMenuItem";
import { useCallback } from "react";
import type { Action } from "entities/Action";
import { copyActionRequest } from "actions/pluginActionActions";
import { CONTEXT_COPY, createMessage } from "ee/constants/messages";

interface Props {
  action: Action;
  disabled?: boolean;
  hideIcon?: boolean;
}

export const Copy = ({ action, disabled, hideIcon }: Props) => {
  const menuPages = useSelector(getPageList);
  const dispatch = useDispatch();

  const copyActionToPage = useCallback(
    (pageId: string) =>
      dispatch(
        copyActionRequest({
          id: action.id,
          destinationEntityId: pageId,
          name: action.name,
        }),
      ),
    [action.id, action.name, dispatch],
  );

  return (
    <MenuSub>
      <MenuSubTrigger
        disabled={disabled}
        {...(!hideIcon && { startIcon: "duplicate" })}
      >
        {createMessage(CONTEXT_COPY)}
      </MenuSubTrigger>
      <MenuSubContent style={{ maxHeight: "350px" }} width="220px">
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
