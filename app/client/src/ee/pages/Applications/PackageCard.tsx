import React, { useCallback, useMemo, useState } from "react";
import { noop } from "lodash";
import { Button, Menu, MenuContent, MenuTrigger } from "design-system";
import {
  EditInteractionKind,
  EditableText,
  SavingState,
} from "design-system-old";

import Card from "components/common/Card";
import { generateEditedByText } from "pages/Applications/helpers";
import type { Package } from "@appsmith/constants/PackageConstants";

type PackageCardProps = {
  isFetchingPackages: boolean;
  isMobile?: boolean;
  pkg: Package; // package is a restricted keyword, so used pkg instead
  workspaceId: string;
};

type ContextMenuProps = {
  handleMenuOnClose: (open: boolean) => void;
  isMenuOpen: boolean;
  packageName: string;
};

const DEFAULT_BACKGROUND_COLOR = "#9747FF1A";
const DEFAULT_ICON = "book";

const ContextMenu = ({
  handleMenuOnClose,
  isMenuOpen,
  packageName,
}: ContextMenuProps) => {
  return (
    <Menu className="more" onOpenChange={handleMenuOnClose} open={isMenuOpen}>
      <MenuTrigger>
        <Button
          className="m-0.5"
          data-testid="t--application-card-context-menu"
          isIconButton
          kind="tertiary"
          size="sm"
          startIcon="context-menu"
        />
      </MenuTrigger>
      <MenuContent side="right" style={{ maxHeight: "unset" }}>
        <div
          onKeyDown={(e) => {
            // This is to prevent the Menu component to take focus away from the input
            // https://github.com/radix-ui/primitives/issues/1175
            e.stopPropagation();
          }}
        >
          <EditableText
            className="px-3 pt-2 pb-2 t--application-name"
            defaultValue={packageName}
            editInteractionKind={EditInteractionKind.SINGLE}
            fill
            hideEditIcon={false}
            isError={false}
            isInvalid={(value: string) => {
              if (!value) {
                return "Name cannot be empty";
              } else {
                return false;
              }
            }}
            onBlur={noop}
            onTextChanged={noop}
            placeholder={"Edit text input"}
            savingState={SavingState.NOT_STARTED}
            underline
          />
        </div>
      </MenuContent>
    </Menu>
  );
};

function PackageCard({ isFetchingPackages, isMobile, pkg }: PackageCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const editedByText = generateEditedByText({
    modifiedAt: pkg.modifiedAt,
    modifiedBy: pkg.modifiedBy,
  });

  const handleMenuOnClose = useCallback((open: boolean) => {
    if (!open) {
      setIsMenuOpen(false);
      setShowOverlay(false);
    } else {
      setIsMenuOpen(true);
    }
  }, []);

  const contextMenu = useMemo(
    () => (
      <ContextMenu
        handleMenuOnClose={handleMenuOnClose}
        isMenuOpen={isMenuOpen}
        packageName={pkg.name}
      />
    ),
    [handleMenuOnClose, isMenuOpen, pkg.name],
  );

  return (
    <Card
      backgroundColor={pkg.color || DEFAULT_BACKGROUND_COLOR}
      contextMenu={contextMenu}
      editedByText={editedByText}
      hasReadPermission
      icon={pkg.icon || DEFAULT_ICON}
      isContextMenuOpen={false}
      isFetching={isFetchingPackages}
      isMobile={isMobile}
      moreActionItems={[]}
      primaryAction={noop}
      setShowOverlay={setShowOverlay}
      showGitBadge={false}
      showOverlay={showOverlay}
      testId="t--package-card"
      title={pkg.name}
      titleTestId="t--app-card-name"
    >
      {/* TODO: @Ashit add manage permission */}
      {!isMenuOpen && (
        <Button
          className="t--package-edit-link"
          // TODO: @Ashit add url placeholder after testing
          href={"/packageEditorURL"}
          size="md"
          startIcon={"pencil-line"}
        >
          Edit
        </Button>
      )}
    </Card>
  );
}

export default PackageCard;
