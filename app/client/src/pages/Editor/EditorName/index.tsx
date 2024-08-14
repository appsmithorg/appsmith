import React, { useState, useCallback } from "react";

import type { noop } from "lodash";
import type {
  CommonComponentProps,
  EditInteractionKind,
} from "@appsmith/ads-old";
import { SavingState } from "@appsmith/ads-old";
import EditableName from "./EditableName";
import { NavigationMenu } from "./NavigationMenu";
import { Menu, toast, MenuTrigger } from "@appsmith/ads";
import type { Theme } from "constants/DefaultTheme";
import ForkApplicationModal from "pages/Applications/ForkApplicationModal";
import { Container, StyledIcon } from "./components";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import type { NavigationMenuDataProps } from "./useNavigationMenuData";
import type { MenuItemData } from "./NavigationMenuItem";
import { useTheme } from "styled-components";

type EditorNameProps = CommonComponentProps & {
  applicationId?: string | undefined;
  defaultValue: string;
  placeholder?: string;
  editInteractionKind: EditInteractionKind;
  defaultSavingState: SavingState;
  onBlur?: (value: string) => void;
  isEditingDefault?: boolean;
  inputValidation?: (value: string) => string | boolean;
  hideEditIcon?: boolean;
  fill?: boolean;
  isError?: boolean;
  isNewEditor: boolean;
  isPopoverOpen: boolean;
  setIsPopoverOpen: typeof noop;
  editorName: string;
  getNavigationMenu: ({
    editMode,
    setForkApplicationModalOpen,
  }: NavigationMenuDataProps) => MenuItemData[];
};

export function EditorName(props: EditorNameProps) {
  const {
    defaultSavingState,
    defaultValue,
    editorName,
    getNavigationMenu,
    isNewEditor,
    isPopoverOpen,
    setIsPopoverOpen,
  } = props;

  const theme = useTheme() as Theme;

  const [isEditingDefault, setIsEditingDefault] = useState(isNewEditor);
  const [isEditing, setIsEditing] = useState(!!isEditingDefault);
  const [isInvalid, setIsInvalid] = useState<string | boolean>(false);
  const [savingState, setSavingState] = useState<SavingState>(
    SavingState.NOT_STARTED,
  );
  const [isForkApplicationModalopen, setForkApplicationModalOpen] =
    useState(false);
  const currentAppId = useSelector(getCurrentApplicationId);

  const onBlur = (value: string) => {
    if (props.onBlur) props.onBlur(value);
    setIsEditingDefault(false);
  };

  const inputValidation = (value: string) => {
    if (value.trim() === "") {
      toast.show(`${editorName} name can't be empty`, {
        kind: "error",
      });
    }
    return false;
  };

  const editMode = useCallback(
    (e: React.MouseEvent) => {
      setIsEditing(true);
      const errorMessage = inputValidation && inputValidation(defaultValue);
      setIsInvalid(errorMessage ? errorMessage : false);
      e.preventDefault();
      e.stopPropagation();
    },
    [inputValidation, defaultValue],
  );

  const handleNameClick = useCallback(() => {
    if (!isEditing) {
      setIsPopoverOpen((isOpen: boolean) => {
        return !isOpen;
      });
    }
  }, [isEditing]);

  const handleOnInteraction = useCallback((nextOpenState: boolean) => {
    if (!nextOpenState) {
      setIsPopoverOpen(false);
    }
  }, []);

  const navigationMenuData = getNavigationMenu({
    editMode,
    theme,
    setForkApplicationModalOpen,
  });

  return defaultValue !== "" ? (
    <>
      <Menu
        className="t--editor-menu"
        onOpenChange={handleOnInteraction}
        open={isPopoverOpen}
      >
        <MenuTrigger disabled={isEditing}>
          <Container data-testid="t--editor-menu-cta" onClick={handleNameClick}>
            <EditableName
              className={props.className}
              defaultSavingState={defaultSavingState}
              defaultValue={defaultValue}
              editInteractionKind={props.editInteractionKind}
              fill={props.fill}
              hideEditIcon
              inputValidation={inputValidation}
              isEditing={isEditing}
              isEditingDefault={isEditingDefault}
              isError={props.isError}
              isInvalid={isInvalid}
              onBlur={onBlur}
              placeholder={props.placeholder}
              savingState={savingState}
              setIsEditing={setIsEditing}
              setIsInvalid={setIsInvalid}
              setSavingState={setSavingState}
            />
            {!isEditing && (
              <StyledIcon
                name={isPopoverOpen ? "expand-less" : "down-arrow"}
                size="md"
              />
            )}
          </Container>
        </MenuTrigger>
        <NavigationMenu
          menuItems={navigationMenuData}
          setIsPopoverOpen={setIsPopoverOpen}
        />
      </Menu>
      {props.applicationId || currentAppId ? (
        <ForkApplicationModal
          applicationId={props.applicationId || currentAppId}
          handleClose={() => {
            setForkApplicationModalOpen(false);
          }}
          isInEditMode
          isModalOpen={isForkApplicationModalopen}
        />
      ) : null}
    </>
  ) : null;
}

export default EditorName;
