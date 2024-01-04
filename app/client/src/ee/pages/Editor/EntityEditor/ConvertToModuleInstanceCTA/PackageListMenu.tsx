import React, { useCallback, useState } from "react";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from "design-system";

import { kebabCase } from "lodash";
import type { ConvertPackageList } from "./usePackageListToConvertEntity";

export interface OnItemClickProps {
  packageId?: string;
}

interface PackageListMenuProps {
  packages: ConvertPackageList;
  isDisabled: boolean;
  onItemClick: (props: OnItemClickProps) => void;
  canCreateNewPackage: boolean;
  title: string;
}

function PackageListMenu({
  canCreateNewPackage,
  isDisabled,
  onItemClick,
  packages,
  title,
}: PackageListMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);

  const onMenuItemClick = useCallback(
    (props: OnItemClickProps) => {
      onItemClick(props);
      closeMenu();
    },
    [onItemClick, closeMenu],
  );

  return (
    <Menu data-testid="t--convert-entity-menu" open={isOpen}>
      <MenuTrigger>
        <Button
          data-testid="t--convert-module-btn"
          endIcon="arrow-down-s-line"
          isDisabled={isDisabled}
          kind="tertiary"
          onClick={openMenu}
          size="md"
        >
          {title}
        </Button>
      </MenuTrigger>
      <MenuContent
        align="center"
        onInteractOutside={() => closeMenu()}
        width="215px"
      >
        {packages.map((pkg) => {
          return (
            <Tooltip
              content={pkg.disabledTooltipText}
              isDisabled={!pkg.disabledTooltipText}
              key={pkg.id}
              placement="top"
            >
              <MenuItem
                data-testid={`t-add-to-${kebabCase(pkg.name)}`}
                disabled={pkg.isDisabled}
                key={pkg.id}
                onSelect={() => onMenuItemClick({ packageId: pkg.id })}
              >
                Add to {pkg.name}
              </MenuItem>
            </Tooltip>
          );
        })}
        <MenuSeparator />
        <MenuItem
          data-testid="t-add-to-new-package"
          disabled={!canCreateNewPackage}
          onSelect={() => onMenuItemClick({ packageId: undefined })}
        >
          Add to a new package
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export default PackageListMenu;
