import React, { useCallback, useEffect, useMemo, useState } from "react";
import { noop } from "lodash";
import type { MenuItemProps } from "design-system";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";
import {
  EditInteractionKind,
  EditableText,
  SavingState,
} from "design-system-old";

import Card from "components/common/Card";
import history from "utils/history";
import { generateEditedByText } from "pages/Applications/helpers";
import { BASE_PACKAGE_EDITOR_URL } from "@appsmith/constants/routes/packageRoutes";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { ModifiedMenuItemProps } from "pages/Applications/ApplicationCard";
import { useDispatch, useSelector } from "react-redux";
import { hasDeletePackagePermission } from "@appsmith/utils/permissionHelpers";
import {
  deletePackage,
  updatePackageName,
} from "@appsmith/actions/packageActions";
import {
  getIsSavingPackageName,
  getisErrorSavingPackageName,
} from "@appsmith/selectors/packageSelectors";

interface PackageCardProps {
  isFetchingPackages: boolean;
  isMobile?: boolean;
  pkg: Package; // package is a restricted keyword, so used pkg instead
  workspaceId: string;
}

interface ContextMenuProps {
  handleMenuOnClose: (open: boolean) => void;
  isMenuOpen: boolean;
  moreActionItems: MenuItemProps[];
  onUpdatePackage: (val: string) => void;
  packageName: string;
  setLastUpdatedValue: (val: string) => void;
}

const DEFAULT_BACKGROUND_COLOR = "#9747FF1A";
const DEFAULT_ICON = "package";

const ContextMenu = ({
  handleMenuOnClose,
  isMenuOpen,
  moreActionItems,
  onUpdatePackage,
  packageName,
  setLastUpdatedValue,
}: ContextMenuProps) => {
  const isSavingName = useSelector(getIsSavingPackageName);
  const isErroredSavingName = useSelector(getisErrorSavingPackageName);

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
            isError={isErroredSavingName}
            isInvalid={(value: string) => {
              if (!value) {
                return "Name cannot be empty";
              } else {
                return false;
              }
            }}
            onBlur={onUpdatePackage}
            onTextChanged={setLastUpdatedValue}
            placeholder={"Edit text input"}
            savingState={
              isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
            }
            underline
          />
        </div>
        <div className="menu-items-wrapper">
          {moreActionItems.map((item: MenuItemProps) => {
            const { children, key, ...restMenuItem } = item;
            return (
              <MenuItem
                {...restMenuItem}
                className={
                  item.startIcon === "delete-bin-line" ? "error-menuitem" : ""
                }
                key={key}
              >
                {children}
              </MenuItem>
            );
          })}
        </div>
      </MenuContent>
    </Menu>
  );
};

function PackageCard({ isFetchingPackages, isMobile, pkg }: PackageCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [moreActionItems, setMoreActionItems] = useState<
    ModifiedMenuItemProps[]
  >([]);
  const [lastUpdatedValue, setLastUpdatedValue] = useState("");
  const packageId = pkg.id;
  const dispatch = useDispatch();

  const hasDeletePermission = hasDeletePackagePermission(pkg.userPermissions);

  useEffect(() => {
    addDeleteOption();
  }, []);

  const editedByText = generateEditedByText({
    modifiedAt: pkg.modifiedAt,
    modifiedBy: pkg.modifiedBy,
  });

  const handleMenuOnClose = useCallback(
    (open: boolean) => {
      if (!open && !isDeleting) {
        setIsMenuOpen(false);
        setShowOverlay(false);
        addDeleteOption();
        if (lastUpdatedValue && pkg.name !== lastUpdatedValue) {
          onUpdatePackage(lastUpdatedValue);
        }
      } else {
        setIsMenuOpen(true);
        setIsDeleting(false);
      }
    },
    [isDeleting, lastUpdatedValue, pkg.name],
  );

  const onUpdatePackage = (val: string) => {
    if (val !== pkg.name) {
      dispatch(updatePackageName(val, pkg));
    }
  };

  const onDeletePackage = () => {
    setShowOverlay(false);
    dispatch(deletePackage({ id: packageId }));
  };

  const askForConfirmation = () => {
    setIsDeleting(true);
    const updatedActionItems = [...moreActionItems];
    updatedActionItems.pop();
    updatedActionItems.push({
      onSelect: onDeletePackage,
      children: "Are you sure?",
      key: "areyousure",
      startIcon: "delete-bin-line",
      "data-testid": "t--delete",
    });
    setMoreActionItems(updatedActionItems);
  };

  const addDeleteOption = () => {
    if (hasDeletePermission && false) {
      const index = moreActionItems.findIndex(
        (el) => el.startIcon === "delete-bin-line",
      );
      const updatedActionItems = [...moreActionItems];
      if (index >= 0) {
        updatedActionItems.pop();
      }
      updatedActionItems.push({
        onSelect: askForConfirmation,
        children: "Delete",
        key: "delete",
        startIcon: "delete-bin-line",
        "data-testid": "t--delete-confirm",
      });
      setMoreActionItems(updatedActionItems);
    }
  };

  const contextMenu = useMemo(
    () => (
      <ContextMenu
        handleMenuOnClose={handleMenuOnClose}
        isMenuOpen={isMenuOpen}
        moreActionItems={moreActionItems}
        onUpdatePackage={onUpdatePackage}
        packageName={pkg.name}
        setLastUpdatedValue={setLastUpdatedValue}
      />
    ),
    [handleMenuOnClose, isMenuOpen, pkg.name],
  );

  const editPackage = useCallback(() => {
    history.push(`${BASE_PACKAGE_EDITOR_URL}/${pkg.id}`);
  }, [pkg.id]);

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
      moreActionItems={moreActionItems}
      primaryAction={noop}
      setShowOverlay={setShowOverlay}
      showGitBadge={false}
      showOverlay={showOverlay}
      testId="t--package-card"
      title={pkg.name}
      titleTestId="t--app-card-name"
    >
      {!isMenuOpen && (
        <Button
          className="t--package-edit-link"
          href={`${BASE_PACKAGE_EDITOR_URL}/${pkg.id}`}
          onClick={editPackage}
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
