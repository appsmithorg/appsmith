/* eslint-disable */
import React, { useCallback, useEffect, useRef } from "react";
import { Menu, Portal } from "@blueprintjs/core";
import type CodeMirror from "codemirror";
import { Editor } from "codemirror";
import classNames from "classnames";
import styled from "styled-components";
import CopyIcon from "remixicon-react/FileCopy2LineIcon";
import CutIcon from "remixicon-react/ScissorsCutLineIcon";
import PasteIcon from "remixicon-react/ClipboardLineIcon";
import TransformIcon from "remixicon-react/EqualizerLineIcon";
import GenerateIcon from "remixicon-react/CodeLineIcon";

type TEditorContextMenuProps = {
  editor: CodeMirror.Editor;
  closeMenu: () => void;
};

const EditorContextMenuDivWrapper = styled.div`
  .bp3-menu-item {
    margin-top: 0;
    display: flex;
    align-items: center;
  }
`;

export function EditorContextMenu(props: TEditorContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { closeMenu, editor } = props;

  const position = editor.cursorCoords(false, "page");
  const { left, top } = position;

  useEffect(() => {
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [closeMenu]);

  const copSelection = useCallback(() => {
    editor.execCommand("copy");
    closeMenu();
  }, [editor]);

  return (
    <Portal>
      <EditorContextMenuDivWrapper
        className={classNames(
          "t--editor-context-menu absolute z-10 bp3-popover",
        )}
        ref={menuRef}
        style={{ left: `${left}px`, top: `${top}px` }}
      >
        <Menu className="!p-0 border border-gray-100 bg-white">
          <Menu.Item
            icon={<GenerateIcon size={14} />}
            onClick={copSelection}
            text="Generate JS code"
          />
          <Menu.Item
            icon={<TransformIcon size={14} />}
            onClick={copSelection}
            text="Transform JS code"
          />
          <Menu.Divider className="!mx-0" />
          <Menu.Item
            icon={<CutIcon size={14} />}
            onClick={copSelection}
            text="Cut"
          />
          <Menu.Item
            icon={<CopyIcon size={14} />}
            onClick={copSelection}
            text="Copy"
          />
          <Menu.Item icon={<PasteIcon size={14} />} text="Paste" />
        </Menu>
      </EditorContextMenuDivWrapper>
    </Portal>
  );
}
