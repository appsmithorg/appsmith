import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  moveJSCollectionRequest,
  copyJSCollectionRequest,
  deleteJSCollection,
} from "actions/jsActionActions";
import { ContextMenuPopoverModifiers } from "@appsmith/pages/Editor/Explorer/helpers";
import noop from "lodash/noop";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";
import { getJSEntityName } from "./helpers";
import styled from "styled-components";
import { Icon, IconSize } from "design-system-old";
import { Intent, Position } from "@blueprintjs/core";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_MOVE,
  createMessage,
} from "@appsmith/constants/messages";
import { getPageListAsOptions } from "selectors/entitiesSelector";
import {
  autoIndentCode,
  getAutoIndentShortcutKeyText,
} from "components/editorComponents/CodeEditor/utils/autoIndentUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { updateJSCollectionBody } from "../../../../actions/jsPaneActions";
import type { IconName } from "@blueprintjs/icons";

type EntityContextMenuProps = {
  id: string;
  name: string;
  className?: string;
  pageId: string;
  isChangePermitted?: boolean;
  isDeletePermitted?: boolean;
};

export const MoreActionablesContainer = styled.div<{ isOpen?: boolean }>`
  width: 34px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;

  &&&& span {
    width: auto;
  }

  &&&& svg > path {
    fill: ${(props) => props.theme.colors.treeDropdown.targetIcon.normal};
  }

  ${(props) =>
    props.isOpen
      ? `
		background-color: ${props.theme.colors.treeDropdown.targetBg};

    &&&& svg > path {
      fill: ${props.theme.colors.treeDropdown.targetIcon.hover};
    }
	`
      : null}

  &:hover {
    background-color: ${(props) => props.theme.colors.treeDropdown.targetBg};

    &&&& svg > path {
      fill: ${(props) => props.theme.colors.treeDropdown.targetIcon.hover};
    }
  }
`;

const prettifyCodeKeyboardShortCut = getAutoIndentShortcutKeyText();

export function MoreJSCollectionsMenu(props: EntityContextMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dispatch = useDispatch();
  const { isChangePermitted = false, isDeletePermitted = false } = props;

  const copyJSCollectionToPage = useCallback(
    (actionId: string, actionName: string, pageId: string) => {
      const nextEntityName = getJSEntityName();
      dispatch(
        copyJSCollectionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: nextEntityName(`${actionName}Copy`, pageId),
        }),
      );
    },
    [dispatch],
  );

  const moveJSCollectionToPage = useCallback(
    (actionId: string, actionName: string, destinationPageId: string) => {
      const nextEntityName = getJSEntityName();
      dispatch(
        moveJSCollectionRequest({
          id: actionId,
          destinationPageId,
          name: nextEntityName(actionName, destinationPageId, false),
        }),
      );
    },
    [dispatch],
  );
  const deleteJSCollectionFromPage = useCallback(
    (actionId: string, actionName: string) =>
      dispatch(deleteJSCollection({ id: actionId, name: actionName })),
    [dispatch],
  );

  const menuPages = useSelector(getPageListAsOptions);

  const options = [
    ...(isChangePermitted
      ? [
          {
            icon: "duplicate" as IconName,
            value: "copy",
            onSelect: noop,
            label: createMessage(CONTEXT_COPY),
            children: menuPages.map((page) => {
              return {
                ...page,
                onSelect: () =>
                  copyJSCollectionToPage(props.id, props.name, page.id),
              };
            }),
          },
        ]
      : []),
    ...(isChangePermitted
      ? [
          {
            icon: "swap-horizontal" as IconName,
            value: "move",
            onSelect: noop,
            label: createMessage(CONTEXT_MOVE),
            children:
              menuPages.length > 1
                ? menuPages
                    .filter((page) => page.id !== props.pageId) // Remove current page from the list
                    .map((page) => {
                      return {
                        ...page,
                        onSelect: () =>
                          moveJSCollectionToPage(props.id, props.name, page.id),
                      };
                    })
                : [{ value: "No Pages", onSelect: noop, label: "No Pages" }],
          },
        ]
      : []),
    ...(isChangePermitted
      ? [
          {
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
              dispatch(updateJSCollectionBody(editor.getValue(), props.id));
              AnalyticsUtil.logEvent("PRETTIFY_CODE_MANUAL_TRIGGER");
            },
            label: "Prettify Code",
          },
        ]
      : []),
    ...(isDeletePermitted
      ? [
          {
            confirmDelete: confirmDelete,
            icon: "trash" as IconName,
            value: "delete",
            onSelect: () => {
              confirmDelete
                ? deleteJSCollectionFromPage(props.id, props.name)
                : setConfirmDelete(true);
            },
            label: confirmDelete
              ? createMessage(CONFIRM_CONTEXT_DELETE)
              : createMessage(CONTEXT_DELETE),
            intent: Intent.DANGER,
            className: "t--apiFormDeleteBtn",
          },
        ]
      : []),
  ];

  return options.length > 0 ? (
    <TreeDropdown
      className={props.className}
      defaultText=""
      menuWidth={260}
      modifiers={ContextMenuPopoverModifiers}
      onMenuToggle={(isOpen: boolean) => setIsMenuOpen(isOpen)}
      onSelect={noop}
      optionTree={options}
      position={Position.LEFT_TOP}
      selectedValue=""
      setConfirmDelete={setConfirmDelete}
      toggle={
        <MoreActionablesContainer
          className={props.className}
          isOpen={isMenuOpen}
        >
          <Icon name="context-menu" size={IconSize.XXXL} />
        </MoreActionablesContainer>
      }
    />
  ) : null;
}

export default MoreJSCollectionsMenu;
