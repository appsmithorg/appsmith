import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getPageList } from "ee/selectors/entitiesSelector";
import React, { useCallback, useMemo } from "react";
import { moveActionRequest } from "actions/pluginActionActions";
import {
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from "@appsmith/ads";
import { CONTEXT_MOVE, createMessage } from "ee/constants/messages";
import { PageMenuItem } from "./PageMenuItem";
import type { Action } from "entities/Action";

interface Props {
  action: Action;
  disabled?: boolean;
}

export const Move = ({ action, disabled }: Props) => {
  const dispatch = useDispatch();

  const currentPageId = useSelector(getCurrentPageId);
  const allPages = useSelector(getPageList);
  const menuPages = useMemo(() => {
    return allPages.filter((page) => page.pageId !== currentPageId);
  }, [allPages, currentPageId]);

  const moveActionToPage = useCallback(
    (destinationPageId: string) =>
      dispatch(
        moveActionRequest({
          id: action.id,
          destinationPageId,
          originalPageId: currentPageId,
          name: action.name,
        }),
      ),
    [dispatch, action.id, action.name, currentPageId],
  );

  return (
    <MenuSub>
      <MenuSubTrigger startIcon="swap-horizontal">
        {createMessage(CONTEXT_MOVE)}
      </MenuSubTrigger>
      <MenuSubContent style={{ maxHeight: "350px" }} width="220px">
        {menuPages.length ? (
          menuPages.map((page) => {
            return (
              <PageMenuItem
                disabled={disabled}
                key={page.basePageId}
                onSelect={moveActionToPage}
                page={page}
              />
            );
          })
        ) : (
          <MenuItem key="no-pages">No pages</MenuItem>
        )}
      </MenuSubContent>
    </MenuSub>
  );
};
