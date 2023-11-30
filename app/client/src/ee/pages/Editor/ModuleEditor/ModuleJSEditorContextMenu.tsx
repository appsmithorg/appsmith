import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteJSCollection } from "actions/jsActionActions";
import {
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
} from "@appsmith/constants/messages";
import {
  autoIndentCode,
  getAutoIndentShortcutKeyText,
} from "components/editorComponents/CodeEditor/utils/autoIndentUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { updateJSCollectionBody } from "actions/jsPaneActions";
import type { IconName } from "@blueprintjs/icons";

import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import type { JSCollection } from "entities/JSCollection";
import {
  JSEditorContextMenu,
  type ContextMenuOption,
} from "pages/Editor/JSEditor/JSEditorContextMenu";
import { deleteModule } from "@appsmith/actions/moduleActions";

interface ModuleJSEditorContextMenuProps {
  jsCollection: JSCollection;
  moduleId: string;
}

const prettifyCodeKeyboardShortCut = getAutoIndentShortcutKeyText();

export function ModuleJSEditorContextMenu({
  jsCollection,
  moduleId,
}: ModuleJSEditorContextMenuProps) {
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

  const deleteJSCollectionFromModule = () => {
    dispatch(
      deleteJSCollection({ id: jsCollection.id, name: jsCollection.name }),
    );
  };

  const deleteJSModule = () => {
    dispatch(deleteModule({ id: moduleId }));
  };

  const onDelete = () => {
    jsCollection.isPublic ? deleteJSModule() : deleteJSCollectionFromModule();
  };

  const confirmDeletion = (value: boolean, event?: Event) => {
    event?.preventDefault?.();
    setConfirmDelete(value);
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
      confirmDelete ? onDelete() : confirmDeletion(true, event);
    },
    label: confirmDelete
      ? createMessage(CONFIRM_CONTEXT_DELETE)
      : createMessage(CONTEXT_DELETE),
    className: "t--apiFormDeleteBtn error-menuitem",
  };

  const options: ContextMenuOption[] = [];
  if (isChangePermitted) {
    options.push(prettifyOptions);
  }

  if (isDeletePermitted) options.push(deleteOption);

  return (
    <JSEditorContextMenu className="t--more-action-menu" options={options} />
  );
}

export default ModuleJSEditorContextMenu;
