import React from "react";
import { MenuSub, MenuSubContent, MenuSubTrigger } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { getPageList } from "selectors/editorSelectors";
import { PageMenuItem } from "./PageMenuItem";
import { useCallback } from "react";
import { CONTEXT_COPY, createMessage } from "ee/constants/messages";
import { copyJSCollectionRequest } from "actions/jsActionActions";
import type { JSCollection } from "entities/JSCollection";

interface Props {
  jsAction: JSCollection;
  disabled?: boolean;
}

export const Copy = ({ disabled, jsAction }: Props) => {
  const menuPages = useSelector(getPageList);
  const dispatch = useDispatch();

  const copyJSActionToPage = useCallback(
    (pageId: string) =>
      dispatch(
        copyJSCollectionRequest({
          id: jsAction.id,
          destinationPageId: pageId,
          name: jsAction.name,
        }),
      ),
    [jsAction.id, jsAction.name, dispatch],
  );

  return (
    <MenuSub>
      <MenuSubTrigger disabled={disabled} startIcon="duplicate">
        {createMessage(CONTEXT_COPY)}
      </MenuSubTrigger>
      <MenuSubContent style={{ maxHeight: "350px" }} width="220px">
        {menuPages.map((page) => {
          return (
            <PageMenuItem
              disabled={disabled}
              key={page.basePageId}
              onSelect={copyJSActionToPage}
              page={page}
            />
          );
        })}
      </MenuSubContent>
    </MenuSub>
  );
};
