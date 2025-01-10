import React, { useCallback, useEffect, useState } from "react";
import {
  createMessage,
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  SUBMIT,
} from "ee/constants/messages";
import { Classes } from "@blueprintjs/core";
import { Button, Input, toast } from "@appsmith/ads";
import { emailValidator } from "@appsmith/ads-old";
import styled from "styled-components";
import type { FetchGlobalProfileResponseData } from "git/requests/fetchGlobalProfileRequest.types";
import type { UpdateGlobalProfileInitPayload } from "git/store/actions/updateGlobalProfileActions";
import noop from "lodash/noop";

const Wrapper = styled.div`
  width: 320px;
  & > div {
    margin-bottom: 16px;
  }
`;

const FieldWrapper = styled.div`
  .user-profile-image-picker {
    width: 166px;
    margin-top: 4px;
  }
`;

const Loader = styled.div`
  height: 38px;
  width: 320px;
  border-radius: 0;
`;

interface GlobalProfileViewProps {
  globalProfile: FetchGlobalProfileResponseData | null;
  isFetchGlobalProfileLoading: boolean;
  isUpdateGlobalProfileLoading: boolean;
  updateGlobalProfile: (data: UpdateGlobalProfileInitPayload) => void;
}

export default function GlobalProfileView({
  globalProfile = null,
  isFetchGlobalProfileLoading = false,
  isUpdateGlobalProfileLoading = false,
  updateGlobalProfile = noop,
}: GlobalProfileViewProps) {
  const [areFormValuesUpdated, setAreFormValuesUpdated] = useState(false);

  const [authorName, setAuthorNameInState] = useState(
    globalProfile?.authorName,
  );
  const [authorEmail, setAuthorEmailInState] = useState(
    globalProfile?.authorEmail,
  );

  const isSubmitDisabled = !authorName || !authorEmail || !areFormValuesUpdated;

  const isLoading = isFetchGlobalProfileLoading || isUpdateGlobalProfileLoading;

  const setAuthorName = useCallback(
    (value: string) => {
      setAuthorNameInState(value);

      if (authorName) setAreFormValuesUpdated(true);
    },
    [authorName],
  );

  const setAuthorEmail = useCallback(
    (value: string) => {
      setAuthorEmailInState(value);

      if (authorEmail) setAreFormValuesUpdated(true);
    },
    [authorEmail],
  );

  const onClickUpdate = useCallback(() => {
    if (authorName && authorEmail && emailValidator(authorEmail).isValid) {
      setAreFormValuesUpdated(false);
      updateGlobalProfile({ authorName, authorEmail });
    } else {
      toast.show("Please enter valid user details");
    }
  }, [authorEmail, authorName, updateGlobalProfile]);

  useEffect(
    function resetOnInitEffect() {
      setAreFormValuesUpdated(false);
      setAuthorNameInState(globalProfile?.authorName ?? "");
      setAuthorEmailInState(globalProfile?.authorEmail ?? "");
    },
    [globalProfile],
  );

  return (
    <Wrapper>
      <FieldWrapper>
        {isLoading && <Loader className={Classes.SKELETON} />}
        {!isLoading && (
          <Input
            data-testid="t--git-author-name"
            isRequired
            label={createMessage(AUTHOR_NAME)}
            labelPosition="top"
            onChange={setAuthorName}
            placeholder={createMessage(AUTHOR_NAME)}
            renderAs="input"
            size="md"
            type="text"
            value={authorName}
          />
        )}
      </FieldWrapper>
      <FieldWrapper>
        {isLoading && <Loader className={Classes.SKELETON} />}
        {!isLoading && (
          <Input
            data-testid="t--git-author-email"
            isRequired
            label={createMessage(AUTHOR_EMAIL)}
            labelPosition="top"
            onChange={setAuthorEmail}
            placeholder={createMessage(AUTHOR_EMAIL)}
            renderAs="input"
            size="md"
            type="text"
            value={authorEmail}
          />
        )}
      </FieldWrapper>
      <FieldWrapper>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <Button
            isDisabled={isSubmitDisabled}
            isLoading={isLoading}
            onClick={onClickUpdate}
            size="md"
          >
            {createMessage(SUBMIT)}
          </Button>
        </div>
      </FieldWrapper>
    </Wrapper>
  );
}
