import React, { createRef, useState } from "react";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { StyledSwitch } from "components/propertyControls/StyledControls";
import Spinner from "components/ads/Spinner";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { getDefaultPageId } from "sagas/SagaUtils";
import { getApplicationViewerPageURL } from "constants/routes";

const ShareWithPublicOption = styled.div`
   {
    display: flex;
    padding: 10px 0px;
    justify-content: space-between;
  }
`;
const CopyToClipboard = styled.div`
  display: flex;
  flex-direction: row;
`;
const StyledInput = styled.input`
  flex: 1;
  border: 1px solid #d3dee3;
  border-right: none;
  padding: 6px 12px;
  font-size: 14px;
  color: #768896;
  border-radius: 4px 0 0 4px;
  width: 90%;
  overflow: hidden;
`;

const SelectButton = styled(BaseButton)`
  &&&& {
    max-width: 70px;
    margin: 0 0px;
    min-height: 32px;
    border-radius: 0px 4px 4px 0px;
    font-weight: bold;
    background-color: #f6f7f8;
    font-size: 14px;
    &.bp3-button {
      padding: 0px 0px;
    }
  }
`;

const ShareToggle = styled.div`
   {
    &&& label {
      margin-bottom: 0px;
    }
    &&& div {
      margin-right: 5px;
    }
    display: flex;
  }
`;

const ShareWithPublic = (props: any) => {
  const {
    currentApplicationDetails,
    applicationId,
    changeAppViewAccess,
    isChangingViewAccess,
    isFetchingApplication,
  } = props;
  const copyURLInput = createRef<HTMLInputElement>();

  const defaultPageId = getDefaultPageId(currentApplicationDetails.pages);
  const appViewEndPoint = getApplicationViewerPageURL(
    applicationId,
    defaultPageId,
  );
  const viewApplicationURL =
    window.location.origin.toString() + appViewEndPoint;
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (url: string) => {
    copy(url);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const selectText = () => {
    if (copyURLInput.current) {
      copyURLInput.current.setSelectionRange(0, viewApplicationURL.length);
    }
  };
  return (
    <>
      <ShareWithPublicOption>
        Make the application public
        <ShareToggle>
          {(isChangingViewAccess || isFetchingApplication) && (
            <Spinner size={20} />
          )}
          {currentApplicationDetails && (
            <StyledSwitch
              onChange={() => {
                changeAppViewAccess(
                  applicationId,
                  !currentApplicationDetails.isPublic,
                );
              }}
              disabled={isChangingViewAccess || isFetchingApplication}
              checked={currentApplicationDetails.isPublic}
              large
            />
          )}
        </ShareToggle>
      </ShareWithPublicOption>

      {currentApplicationDetails.isPublic && (
        <CopyToClipboard>
          <StyledInput
            type="text"
            ref={copyURLInput}
            readOnly
            onClick={() => {
              selectText();
            }}
            value={viewApplicationURL}
          />
          <SelectButton
            text={isCopied ? "Copied" : "Copy"}
            accent="secondary"
            onClick={() => {
              copyToClipboard(viewApplicationURL);
            }}
          />
        </CopyToClipboard>
      )}
    </>
  );
};

export default ShareWithPublic;
