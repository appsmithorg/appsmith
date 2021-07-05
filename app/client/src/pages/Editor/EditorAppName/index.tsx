import React, { useState, useCallback } from "react";

import styled from "styled-components";
import { Classes, Menu, Popover, Position } from "@blueprintjs/core";
import { noop } from "lodash";

import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import Icon, { IconSize } from "components/ads/Icon";
import { SavingState } from "components/ads/EditableTextSubComponent";
import { EditInteractionKind } from "components/ads/EditableText";
import { CommonComponentProps } from "components/ads/common";
import { getTypographyByKey } from "constants/DefaultTheme";
import {
  NAVIGATION_BAR_CONTENT_COLOR,
  NAVIGATION_BAR_BACKGROUND_COLOR,
  NAVIGATION_BAR_MENU_FONT_SIZE,
} from "constants/NavigationConstants";

import EditableAppName from "./EditableAppName";
import { GetNavigationMenuData } from "./NavigationMenuData";
import { NavigationMenu } from "./NavigationMenu";

type EditorAppNameProps = CommonComponentProps & {
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
};

const Container = styled.div<{ isPopoverOpen: boolean }>`
  display: flex;
  cursor: pointer;
  ${(props) =>
      props.isPopoverOpen && `background-color: rgba(167, 182, 194, 0.3);`}
    :hover {
    background-color: rgba(167, 182, 194, 0.3);
  }
  & .${Classes.POPOVER_TARGET} {
    height: 100%;
  }
  & .${Classes.EDITABLE_TEXT} {
    height: ${(props) => props.theme.smallHeaderHeight} !important;
    display: block;
    cursor: pointer;
  }
  &&&& .${Classes.EDITABLE_TEXT}, &&&& .${Classes.EDITABLE_TEXT_EDITING} {
    padding: 0 ${(props) => props.theme.spaces[0]}px;
    width: 100%;
  }
  &&&& .${Classes.EDITABLE_TEXT_CONTENT}, &&&& .${Classes.EDITABLE_TEXT_INPUT} {
    display: block;
    ${(props) => getTypographyByKey(props, "h4")};
    line-height: 19px !important;
    padding: 8px 5px;
  }
  &&&& .${Classes.EDITABLE_TEXT_INPUT} {
    padding: 8px 25px 8px 5px;
  }
`;

const StyledIcon = styled(Icon)`
  height: 100%;
  padding-right: 10px;
  align-self: center;
`;

const StyledMenu = styled(Menu)`
  margin-top: -8px;
  background: ${NAVIGATION_BAR_BACKGROUND_COLOR};
  font-size: ${NAVIGATION_BAR_MENU_FONT_SIZE};

  &&& .${Classes.MENU} {
    background: ${NAVIGATION_BAR_BACKGROUND_COLOR};
    color: ${NAVIGATION_BAR_CONTENT_COLOR};
  }
`;

export default function EditorAppName(props: EditorAppNameProps) {
  const {
    applicationId,
    currentDeployLink,
    defaultSavingState,
    defaultValue,
    deploy,
    isNewApp,
  } = props;

  const [isEditingDefault, setIsEditingDefault] = useState(isNewApp);
  const [isEditing, setIsEditing] = useState(!!isEditingDefault);
  const [isInvalid, setIsInvalid] = useState<string | boolean>(false);
  const [savingState, setSavingState] = useState<SavingState>(
    SavingState.NOT_STARTED,
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const dropDownIconName = isPopoverOpen ? "upArrow" : "downArrow";

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
    },
    [inputValidation, defaultValue],
  );

  const handleAppNameClick = useCallback(() => {
    if (!isEditing) {
      setIsPopoverOpen((isOpen) => {
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
    applicationId,
    currentDeployLink,
    editMode,
    deploy,
  });

  const NavigationMenuItems = (
    <StyledMenu>
      <NavigationMenu
        menuItems={NavigationMenuData}
        setIsPopoverOpen={setIsPopoverOpen}
      />
    </StyledMenu>
  );

  return (
    <Popover
      autoFocus={false}
      content={NavigationMenuItems}
      isOpen={isPopoverOpen}
      minimal
      onInteraction={handleOnInteraction}
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
            fillColor={NAVIGATION_BAR_CONTENT_COLOR}
            name={dropDownIconName}
            size={IconSize.XXS}
          />
        )}
      </Container>
    </Popover>
  );
}
