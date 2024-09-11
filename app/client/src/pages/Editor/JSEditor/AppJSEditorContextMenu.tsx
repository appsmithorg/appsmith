import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  moveJSCollectionRequest,
  copyJSCollectionRequest,
  deleteJSCollection,
} from "actions/jsActionActions";
import noop from "lodash/noop";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_MOVE,
  createMessage,
} from "ee/constants/messages";
import { getPageListAsOptions } from "ee/selectors/entitiesSelector";
import {
  autoIndentCode,
  getAutoIndentShortcutKeyText,
} from "components/editorComponents/CodeEditor/utils/autoIndentUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { updateJSCollectionBody } from "actions/jsPaneActions";
import type { IconName } from "@blueprintjs/icons";

import type { ContextMenuOption } from "./JSEditorContextMenu";
import JSEditorContextMenu from "./JSEditorContextMenu";
import equal from "fast-deep-equal/es6";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { JSCollection } from "entities/JSCollection";

interface AppJSEditorContextMenuProps {
  pageId: string;
  jsCollection: JSCollection;
}

const prettifyCodeKeyboardShortCut = getAutoIndentShortcutKeyText();

export function AppJSEditorContextMenu({
  jsCollection,
  pageId,
}: AppJSEditorContextMenuProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dispatch = useDispatch();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isDeletePermitted = getHasDeleteActionPermission(
    isFeatureEnabled,
    jsCollection?.userPermissions || [],
  );
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    jsCollection?.userPermissions || [],
  );

  const copyJSCollectionToPage = useCallback(
    (actionId: string, actionName: string, pageId: string) => {
      dispatch(
        copyJSCollectionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: actionName,
        }),
      );
    },
    [dispatch],
  );

  const moveJSCollectionToPage = useCallback(
    (actionId: string, actionName: string, destinationPageId: string) => {
      dispatch(
        moveJSCollectionRequest({
          id: actionId,
          destinationPageId,
          name: actionName,
        }),
      );
    },
    [dispatch],
  );
  const deleteJSCollectionFromPage = useCallback(
    (actionId: string, actionName: string) => {
      dispatch(deleteJSCollection({ id: actionId, name: actionName }));
      setConfirmDelete(false);
    },
    [dispatch],
  );

  const confirmDeletion = (value: boolean, event?: Event) => {
    event?.preventDefault?.();
    setConfirmDelete(value);
  };

  const menuPages = useSelector(getPageListAsOptions, equal);

  const copyOption = {
    icon: "duplicate" as IconName,
    value: "copy",
    onSelect: noop,
    label: createMessage(CONTEXT_COPY),
    children: menuPages.map((page) => {
      return {
        ...page,
        onSelect: () =>
          copyJSCollectionToPage(jsCollection.id, jsCollection.name, page.id),
      };
    }),
  };

  const moveOption = {
    icon: "swap-horizontal" as IconName,
    value: "move",
    onSelect: noop,
    label: createMessage(CONTEXT_MOVE),
    children:
      menuPages.length > 1
        ? menuPages
            .filter((page) => page.id !== pageId) // Remove current page from the list
            .map((page) => {
              return {
                ...page,
                onSelect: () =>
                  moveJSCollectionToPage(
                    jsCollection.id,
                    jsCollection.name,
                    page.id,
                  ),
              };
            })
        : [{ value: "No Pages", onSelect: noop, label: "No Pages" }],
  };

  const prettifyOptions = {
    value: "prettify",
    icon: "code" as IconName,
    subText: prettifyCodeKeyboardShortCut,
    onSelect: () => {
      /*
        PS: Please do not remove ts-ignore from here, TS keeps suggesting that
        the object is null, but that is not the case, and we need an
        instance of the editor to pass to autoIndentCode function
        */
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const editor = document.querySelector(".CodeMirror").CodeMirror;
      autoIndentCode(editor);
      dispatch(updateJSCollectionBody(editor.getValue(), jsCollection.id));
      AnalyticsUtil.logEvent("PRETTIFY_CODE_MANUAL_TRIGGER");
    },
    label: "Prettify code",
  };

  const deleteOption = {
    confirmDelete: confirmDelete,
    icon: "delete-bin-line" as IconName,
    value: "delete",
    onSelect: (event?: Event): void => {
      confirmDelete
        ? deleteJSCollectionFromPage(jsCollection.id, jsCollection.name)
        : confirmDeletion(true, event);
    },
    label: confirmDelete
      ? createMessage(CONFIRM_CONTEXT_DELETE)
      : createMessage(CONTEXT_DELETE),
    className: "t--apiFormDeleteBtn error-menuitem",
  };

  const options: ContextMenuOption[] = [];
  if (isChangePermitted) {
    options.push(copyOption);
    options.push(moveOption);
    options.push(prettifyOptions);
  }

  if (isDeletePermitted) options.push(deleteOption);

  return (
    <JSEditorContextMenu
      className="t--more-action-menu"
      onMenuClose={() => {
        setConfirmDelete(false);
      }}
      options={options}
    />
  );
}

export default AppJSEditorContextMenu;
