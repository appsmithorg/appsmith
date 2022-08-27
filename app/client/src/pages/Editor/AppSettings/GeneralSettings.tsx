import { EditableText, EditInteractionKind, SavingState } from "components/ads";
import { IconSelector } from "design-system";
import React from "react";
import { useSelector } from "react-redux";
import { getCurrentApplication } from "selectors/applicationSelectors";
import styled from "styled-components";

const IconSelectorWrapper = styled.div`
  position: relative;
  // .t--icon-selected {
  //   background-color: #fff;
  //   svg {
  //     path {
  //       fill: #000;
  //     }
  //   }
  // }
  .icon-selector {
    max-height: 130px;
  }
  .icon-selector::-webkit-scrollbar-thumb {
    background-color: transparent;
  }
  .icon-selector::-webkit-scrollbar {
    width: 0px;
  }
`;

function GeneralSettings() {
  const isErroredSavingName = false;
  const isSavingName = false;
  const application = useSelector(getCurrentApplication);
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
        placeholder={"Edit text input"}
        savingState={
          isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
        }
        underline
      />
      <IconSelectorWrapper>
        <IconSelector
          className="icon-selector"
          fill
          selectedColor="black"
          selectedIcon={application?.icon}
        />
      </IconSelectorWrapper>
    </>
  );
}

export default GeneralSettings;
