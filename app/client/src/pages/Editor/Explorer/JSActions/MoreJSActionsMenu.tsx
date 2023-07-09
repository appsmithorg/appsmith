import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  moveJSCollectionRequest,
  copyJSCollectionRequest,
  deleteJSCollection,
} from "actions/jsActionActions";
import noop from "lodash/noop";
import { getJSEntityName } from "./helpers";
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
import { updateJSCollectionBody } from "actions/jsPaneActions";
import type { IconName } from "@blueprintjs/icons";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Text,
} from "design-system";

type EntityContextMenuProps = {
  id: string;
  name: string;
  className?: string;
  pageId: string;
  isChangePermitted?: boolean;
  isDeletePermitted?: boolean;
};

const prettifyCodeKeyboardShortCut = getAutoIndentShortcutKeyText();

export function MoreJSCollectionsMenu(props: EntityContextMenuProps) {
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

  const confirmDeletion = (event: Event, value: boolean) => {
    event.preventDefault();
    setConfirmDelete(value);
  };

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
            label: "Prettify code",
          },
        ]
      : []),
    ...(isDeletePermitted
      ? [
          {
            confirmDelete: confirmDelete,
            icon: "delete-bin-line" as IconName,
            value: "delete",
            onSelect: (event: Event): void => {
              confirmDelete
                ? deleteJSCollectionFromPage(props.id, props.name)
                : confirmDeletion(event, true);
            },
            label: confirmDelete
              ? createMessage(CONFIRM_CONTEXT_DELETE)
              : createMessage(CONTEXT_DELETE),
            className: "t--apiFormDeleteBtn error-menuitem",
          },
        ]
      : []),
  ];

  if (options.length === 0) {
    return null;
  }
  return (
    <Menu className={props.className}>
      <MenuTrigger>
        <Button
          data-testid="more-action-trigger"
          isIconButton
          kind="tertiary"
          size="md"
          startIcon="context-menu"
        />
      </MenuTrigger>
      <MenuContent avoidCollisions>
        {options.map((option) => {
          if (option.children) {
            return (
              <MenuSub>
                <MenuSubTrigger startIcon={option.icon}>
                  {option.label}
                </MenuSubTrigger>
                <MenuSubContent>
                  {option.children.map((children) => (
                    <MenuItem key={children.value} onSelect={children.onSelect}>
                      {children.label}
                    </MenuItem>
                  ))}
                </MenuSubContent>
              </MenuSub>
            );
          }
          return (
            <MenuItem
              className={option?.className}
              key={option.value}
              onSelect={option.onSelect as any}
              startIcon={option.icon}
            >
              <div>
                <Text
                  color={
                    option?.value === "delete"
                      ? "var(--ads-v2-color-fg-error)"
                      : "var(--ads-v2-color-fg)"
                  }
                >
                  {option.label}
                </Text>
                {option.subText && (
                  <Text
                    color={"var(--ads-v2-color-fg-muted)"}
                    kind="body-s"
                    style={{ marginLeft: "7px" }}
                  >
                    {option.subText}
                  </Text>
                )}
              </div>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}

export default MoreJSCollectionsMenu;
