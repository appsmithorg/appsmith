import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { noop } from "lodash";
import type { MenuItemProps } from "design-system";
import {
  Button,
  Divider,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";
import {
  ColorSelector,
  EditInteractionKind,
  EditableText,
  SavingState,
} from "design-system-old";

import Card from "components/common/Card";
import history from "utils/history";
import { generateEditedByText } from "pages/Applications/helpers";
import { BASE_PACKAGE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import {
  DEFAULT_PACKAGE_COLOR,
  DEFAULT_PACKAGE_ICON,
  type Package,
} from "@appsmith/constants/PackageConstants";
import type { ModifiedMenuItemProps } from "pages/Applications/ApplicationCard";
import { useDispatch, useSelector } from "react-redux";
import { hasDeletePackagePermission } from "@appsmith/utils/permissionHelpers";
import { deletePackage, updatePackage } from "@appsmith/actions/packageActions";
import {
  getIsSavingPackageName,
  getisErrorSavingPackageName,
} from "@appsmith/selectors/packageSelectors";
import { ThemeContext } from "styled-components";
import { getRandomPaletteColor } from "utils/AppsmithUtils";

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
  pkg: Package;
  setLastUpdatedValue: (val: string) => void;
  updateColor: (color: string) => void;
}

const ContextMenu = ({
  handleMenuOnClose,
  isMenuOpen,
  moreActionItems,
  onUpdatePackage,
  pkg,
  setLastUpdatedValue,
  updateColor,
}: ContextMenuProps) => {
  const isSavingName = useSelector(getIsSavingPackageName);
  const isErroredSavingName = useSelector(getisErrorSavingPackageName);
  const theme = useContext(ThemeContext);
  const colorCode =
    pkg.color || getRandomPaletteColor(theme.colors.appCardColors);

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
            defaultValue={pkg.name}
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
        <>
          <ColorSelector
            colorPalette={theme.colors.appCardColors}
            defaultValue={colorCode}
            fill
            onSelect={updateColor}
          />
          <Divider />
        </>
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
      dispatch(
        updatePackage({
          name: val,
          id: pkg.id,
        }),
      );
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
    if (hasDeletePermission) {
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

  const updateColor = (color: string) => {
    dispatch(
      updatePackage({
        color: color,
        id: pkg.id,
      }),
    );
  };

  const contextMenu = useMemo(
    () => (
      <ContextMenu
        handleMenuOnClose={handleMenuOnClose}
        isMenuOpen={isMenuOpen}
        moreActionItems={moreActionItems}
        onUpdatePackage={onUpdatePackage}
        pkg={pkg}
        setLastUpdatedValue={setLastUpdatedValue}
        updateColor={updateColor}
      />
    ),
    [handleMenuOnClose, isMenuOpen, pkg.name],
  );

  const editPackage = useCallback(() => {
    history.push(`${BASE_PACKAGE_EDITOR_PATH}/${pkg.id}`);
  }, [pkg.id]);

  return (
    <Card
      backgroundColor={pkg.color || DEFAULT_PACKAGE_COLOR}
      contextMenu={contextMenu}
      editedByText={editedByText}
      hasReadPermission
      icon={pkg.icon || DEFAULT_PACKAGE_ICON}
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
          href={`${BASE_PACKAGE_EDITOR_PATH}/${pkg.id}`}
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
