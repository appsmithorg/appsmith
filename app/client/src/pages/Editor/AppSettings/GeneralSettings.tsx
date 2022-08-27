import {
  AppIconName,
  EditableText,
  EditInteractionKind,
  SavingState,
} from "components/ads";
import { IconSelector, MenuDivider } from "design-system";
import React, { useContext } from "react";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useSelector } from "react-redux";
import styled, { ThemeContext } from "styled-components";
import { getCurrentApplication } from "selectors/applicationSelectors";

const IconScrollWrapper = styled.div`
  position: relative;
  .t--icon-selected {
    background-color: rgba(248, 106, 43, 0.2);
    border: 1px solid ${(props) => props.theme.colors.applications.cardMenuIcon};
    svg {
      path {
        fill: ${(props) => props.theme.colors.applications.iconColor};
      }
    }
  }
  .icon-selector::-webkit-scrollbar-thumb {
    background-color: transparent;
  }
  .icon-selector::-webkit-scrollbar {
    width: 0px;
  }
`;

function GeneralSettings(props: any) {
  const isErroredSavingName = false;
  const applicationId = useSelector(getCurrentApplicationId);
  const setLastUpdatedValue = (value: any) => {
    console.log(value);
  };
  const isSavingName = false;

  const theme = useContext(ThemeContext);
  const updateIcon = (icon: AppIconName) => {
    console.log(icon);
  };
  const application = useSelector(getCurrentApplication);
  console.log("General settings", props);
  return (
    <>
      <EditableText
        className="px-3 pt-3 pb-2"
        defaultValue={application?.name || ""}
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
        onBlur={(value: string) => {
          props.update &&
            props.update(applicationId, {
              name: value,
            });
        }}
        onTextChanged={(value: string) => {
          setLastUpdatedValue(value);
        }}
        placeholder={"Edit text input"}
        savingState={
          isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
        }
        underline
      />
      <MenuDivider />
      <IconScrollWrapper>
        <IconSelector
          className="icon-selector"
          fill
          onSelect={updateIcon}
          selectedColor={theme.colors.applications.cardMenuIcon}
          selectedIcon={application?.icon}
        />
        <MenuDivider />
      </IconScrollWrapper>
    </>
  );
}

export default GeneralSettings;
