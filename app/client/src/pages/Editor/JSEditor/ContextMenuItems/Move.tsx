import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getPageList } from "ee/selectors/entitiesSelector";
import React, { useCallback, useMemo } from "react";
import {
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from "@appsmith/ads";
import { CONTEXT_MOVE, createMessage } from "ee/constants/messages";
import { PageMenuItem } from "./PageMenuItem";
import { moveJSCollectionRequest } from "actions/jsActionActions";
import type { JSCollection } from "entities/JSCollection";

interface Props {
  jsAction: JSCollection;
  disabled?: boolean;
}

export const Move = ({ disabled, jsAction }: Props) => {
  const dispatch = useDispatch();

  const currentPageId = useSelector(getCurrentPageId);
  const allPages = useSelector(getPageList);
  const menuPages = useMemo(() => {
    return allPages.filter((page) => page.pageId !== currentPageId);
  }, [allPages, currentPageId]);

  const moveJSActionToPage = useCallback(
    (destinationPageId: string) =>
      dispatch(
        moveJSCollectionRequest({
          id: jsAction.id,
          destinationPageId,
          name: jsAction.name,
        }),
      ),
    [dispatch, jsAction.id, jsAction.name],
  );

  return (
    <MenuSub>
      <MenuSubTrigger disabled={disabled} startIcon="swap-horizontal">
        {createMessage(CONTEXT_MOVE)}
      </MenuSubTrigger>
      <MenuSubContent style={{ maxHeight: "350px" }} width="220px">
        {menuPages.length ? (
          menuPages.map((page) => {
            return (
              <PageMenuItem
                disabled={disabled}
                key={page.basePageId}
                onSelect={moveJSActionToPage}
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
