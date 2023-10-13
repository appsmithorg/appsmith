import React, { useState, useCallback } from "react";

import { useTheme } from "styled-components";
import type { noop } from "lodash";
import type {
  CommonComponentProps,
  EditInteractionKind,
} from "design-system-old";
import { SavingState } from "design-system-old";
import EditableAppName from "./EditableAppName";
import { GetNavigationMenuData } from "./NavigationMenuData";
import { NavigationMenu } from "./NavigationMenu";
import type { Theme } from "constants/DefaultTheme";
import { Menu, toast, MenuTrigger } from "design-system";
import ForkApplicationModal from "pages/Applications/ForkApplicationModal";
import { Container, StyledIcon } from "./components";

type EditorAppNameProps = CommonComponentProps & {
  applicationId: string | undefined;
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
  isNewApp: boolean;
  isPopoverOpen: boolean;
  setIsPopoverOpen: typeof noop;
};

export function EditorAppName(props: EditorAppNameProps) {
  const {
    defaultSavingState,
    defaultValue,
    isNewApp,
    isPopoverOpen,
    setIsPopoverOpen,
  } = props;

  const theme = useTheme() as Theme;

  const [isEditingDefault, setIsEditingDefault] = useState(isNewApp);
  const [isEditing, setIsEditing] = useState(!!isEditingDefault);
  const [isInvalid, setIsInvalid] = useState<string | boolean>(false);
  const [savingState, setSavingState] = useState<SavingState>(
    SavingState.NOT_STARTED,
  );
  const [isForkApplicationModalopen, setForkApplicationModalOpen] =
    useState(false);

  const onBlur = (value: string) => {
    if (props.onBlur) props.onBlur(value);
    setIsEditingDefault(false);
  };

  const inputValidation = (value: string) => {
    if (value.trim() === "") {
      toast.show("Application name can't be empty", {
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

  const handleAppNameClick = useCallback(() => {
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

  const NavigationMenuData = GetNavigationMenuData({
    editMode,
    theme,
    setForkApplicationModalOpen,
  });

  return defaultValue !== "" ? (
    <>
      <Menu
        className="t--application-edit-menu"
        onOpenChange={handleOnInteraction}
        open={isPopoverOpen}
      >
        <MenuTrigger disabled={isEditing}>
          <Container
            data-testid="t--application-edit-menu-cta"
            onClick={handleAppNameClick}
          >
            <EditableAppName
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
          menuItems={NavigationMenuData}
          setIsPopoverOpen={setIsPopoverOpen}
        />
      </Menu>
      <ForkApplicationModal
        applicationId={props.applicationId || ""}
        handleClose={() => {
          setForkApplicationModalOpen(false);
        }}
        isInEditMode
        isModalOpen={isForkApplicationModalopen}
      />
    </>
  ) : null;
}

export default EditorAppName;
