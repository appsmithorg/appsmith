import React, { useState, useCallback } from "react";

import styled, { withTheme } from "styled-components";
import { Classes, Menu, Position } from "@blueprintjs/core";
import { Classes as Popover2Classes, Popover2 } from "@blueprintjs/popover2";
import { noop } from "lodash";

import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import Icon, { IconSize } from "components/ads/Icon";
import { SavingState } from "components/ads/EditableTextSubComponent";
import { EditInteractionKind } from "components/ads/EditableText";
import { CommonComponentProps, ThemeProp } from "components/ads/common";
import { getTypographyByKey } from "constants/DefaultTheme";

import EditableAppName from "./EditableAppName";
import { GetNavigationMenuData } from "./NavigationMenuData";
import { NavigationMenu } from "./NavigationMenu";

type EditorAppNameProps = CommonComponentProps &
  ThemeProp & {
    applicationId: string | undefined;
    defaultValue: string;
    placeholder?: string;
    editInteractionKind: EditInteractionKind;
    defaultSavingState: SavingState;
    deploy: typeof noop;
    onBlur?: (value: string) => void;
    isEditingDefault?: boolean;
    inputValidation?: (value: string) => string | boolean;
    hideEditIcon?: boolean;
    fill?: boolean;
    isError?: boolean;
    isNewApp: boolean;
    currentDeployLink: string;
    isPopoverOpen: boolean;
    setIsPopoverOpen: typeof noop;
  };

const Container = styled.div<{ isPopoverOpen: boolean }>`
  display: flex;
  cursor: pointer;
  ${(props) =>
    props.isPopoverOpen &&
    `
      background-color: ${props.theme.colors.navigationMenu.backgroundInactive};
    `}
  &:hover {
    background-color: ${(props) =>
      props.theme.colors.navigationMenu.backgroundActive};
  }

  > span {
    height: ${(props) => props.theme.smallHeaderHeight};
  }

  & .${Popover2Classes.POPOVER2_TARGET} {
    height: 100%;
  }
  & .${Classes.EDITABLE_TEXT} {
    height: ${(props) => props.theme.smallHeaderHeight} !important;
    display: block;
    cursor: pointer;
  }
  &&&& .${Classes.EDITABLE_TEXT}, &&&& .${Classes.EDITABLE_TEXT_EDITING} {
    padding: 0;
    width: 100%;
  }
  &&&& .${Classes.EDITABLE_TEXT_CONTENT}, &&&& .${Classes.EDITABLE_TEXT_INPUT} {
    display: block;
    ${(props) => getTypographyByKey(props, "h4")};
    line-height: ${(props) => props.theme.smallHeaderHeight} !important;
    padding: 0 ${(props) => props.theme.spaces[2]}px;
  }
  &&&& .${Classes.EDITABLE_TEXT_INPUT} {
    margin-right: 20px;
  }
`;

const StyledIcon = styled(Icon)`
  height: 100%;
  padding-right: ${(props) => props.theme.spaces[2]}px;
  align-self: center;
`;

const StyledMenu = styled(Menu)`
  background: ${(props) =>
    props.theme.colors.navigationMenu.backgroundInactive};
  color: ${(props) => props.theme.colors.navigationMenu.contentInactive};
  ${(props) => getTypographyByKey(props, "p1")};
  border-radius: 0;
  padding: 0;

  &&& .${Classes.MENU}, &&& .${Classes.MENU_SUBMENU} {
    background: ${(props) =>
      props.theme.colors.navigationMenu.backgroundInactive};
    color: ${(props) => props.theme.colors.navigationMenu.contentInactive};
    border-radius: 0;
    padding: 0;

    .${Classes.TRANSITION_CONTAINER} {
      margin-top: -4px;
    }

    .${Classes.ICON} {
      color: ${(props) => props.theme.colors.navigationMenu.contentInactive};
      height: 100%;
      margin-top: 0;
      > svg {
        height: 100%;
      }
    }

    .${Classes.POPOVER_TARGET}.${Classes.POPOVER_OPEN} > .${Classes.MENU_ITEM} {
      color: ${(props) => props.theme.colors.navigationMenu.contentActive};
      background: ${(props) =>
        props.theme.colors.navigationMenu.backgroundActive};
      background-color: ${(props) =>
        props.theme.colors.navigationMenu.backgroundActive};
    }
  }

  &&& .${Classes.MENU_SUBMENU}:hover {
    .${Classes.ICON} {
      color: ${(props) => props.theme.colors.navigationMenu.contentActive};
    }
  }
`;

export function EditorAppName(props: EditorAppNameProps) {
  const {
    currentDeployLink,
    defaultSavingState,
    defaultValue,
    deploy,
    isNewApp,
    isPopoverOpen,
    setIsPopoverOpen,
    theme,
  } = props;

  const [isEditingDefault, setIsEditingDefault] = useState(isNewApp);
  const [isEditing, setIsEditing] = useState(!!isEditingDefault);
  const [isInvalid, setIsInvalid] = useState<string | boolean>(false);
  const [savingState, setSavingState] = useState<SavingState>(
    SavingState.NOT_STARTED,
  );

  const onBlur = (value: string) => {
    if (props.onBlur) props.onBlur(value);
    setIsEditingDefault(false);
  };

  const inputValidation = (value: string) => {
    if (value.trim() === "") {
      Toaster.show({
        text: "Application name can't be empty",
        variant: Variant.danger,
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
    currentDeployLink,
    editMode,
    deploy,
    theme,
  });

  const NavigationMenuItems = (
    <StyledMenu>
      <NavigationMenu
        menuItems={NavigationMenuData}
        setIsPopoverOpen={setIsPopoverOpen}
      />
    </StyledMenu>
  );

  return defaultValue !== "" ? (
    <Popover2
      autoFocus={false}
      content={NavigationMenuItems}
      isOpen={isPopoverOpen}
      minimal
      onInteraction={handleOnInteraction}
      portalClassName="t--editor-appname-menu-portal"
      position={Position.BOTTOM_RIGHT}
    >
      <Container isPopoverOpen={isPopoverOpen} onClick={handleAppNameClick}>
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
            fillColor={theme.colors.navigationMenu.contentActive}
            name={isPopoverOpen ? "expand-less" : "down-arrow"}
            size={IconSize.XXL}
          />
        )}
      </Container>
    </Popover2>
  ) : null;
}

export default withTheme(EditorAppName);
