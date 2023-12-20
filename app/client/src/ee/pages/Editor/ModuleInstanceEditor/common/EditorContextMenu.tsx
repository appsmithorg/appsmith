import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";
import { useToggle } from "@mantine/hooks";

import {
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_DELETE,
  createMessage,
} from "@appsmith/constants/messages";

interface EditorContextMenuProps {
  isDeletePermitted: boolean;
  className?: string;
  onDelete: () => void;
}

function EditorContextMenu({
  className,
  isDeletePermitted,
  onDelete,
}: EditorContextMenuProps) {
  const [isMenuOpen, toggleMenuOpen] = useToggle([false, true]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onDeleteClick = (e?: Event) => {
    e?.preventDefault();
    confirmDelete ? onDelete() : setConfirmDelete(true);
  };

  // Do not show anything if no items are available to use.
  if (!isDeletePermitted) return null;

  return (
    <Menu className={className} onOpenChange={toggleMenuOpen} open={isMenuOpen}>
      <MenuTrigger>
        <Button
          data-testid="t--more-action-trigger"
          isIconButton
          kind="tertiary"
          size="md"
          startIcon="context-menu"
        />
      </MenuTrigger>
      <MenuContent loop style={{ zIndex: 100 }} width="200px">
        <MenuItem
          className="t--more-action-deleteBtn error-menuitem"
          onSelect={onDeleteClick}
          startIcon="trash"
        >
          {confirmDelete
            ? createMessage(CONFIRM_CONTEXT_DELETE)
            : createMessage(CONTEXT_DELETE)}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export default EditorContextMenu;
