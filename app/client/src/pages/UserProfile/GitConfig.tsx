import React, { useEffect, useState } from "react";
import { Wrapper, FieldWrapper, Loader } from "./StyledComponents";
import {
  createMessage,
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  SUBMIT,
} from "ee/constants/messages";
import { Classes } from "@blueprintjs/core";
import { Button, Input, toast } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import {
  getGlobalGitConfig,
  getIsFetchingGlobalGitConfig,
} from "selectors/gitSyncSelectors";
import { updateGlobalGitConfigInit } from "actions/gitSyncActions";
import { emailValidator } from "@appsmith/ads-old";

export default function GitConfig() {
  const dispatch = useDispatch();
  const globalGitConfig = useSelector(getGlobalGitConfig);

  const [areFormValuesUpdated, setAreFormValuesUpdated] = useState(false);

  const [authorName, setAuthorNameInState] = useState(
    globalGitConfig.authorName,
  );
  const [authorEmail, setAuthorEmailInState] = useState(
    globalGitConfig.authorEmail,
  );

  const setAuthorName = (value: string) => {
    setAuthorNameInState(value);

    if (authorName) setAreFormValuesUpdated(true);
  };

  const setAuthorEmail = (value: string) => {
    setAuthorEmailInState(value);

    if (authorEmail) setAreFormValuesUpdated(true);
  };

  const isFetching = useSelector(getIsFetchingGlobalGitConfig);
  const isSubmitDisabled = !authorName || !authorEmail || !areFormValuesUpdated;

  useEffect(() => {
    setAreFormValuesUpdated(false);
    setAuthorNameInState(globalGitConfig.authorName);
    setAuthorEmailInState(globalGitConfig.authorEmail);
  }, [globalGitConfig]);

  const updateConfig = () => {
    if (authorName && authorEmail && emailValidator(authorEmail).isValid) {
      setAreFormValuesUpdated(false);
      dispatch(updateGlobalGitConfigInit({ authorName, authorEmail }));
    } else {
      toast.show("Please enter valid user details");
    }
  };

  return (
    <Wrapper>
      <FieldWrapper>
        {isFetching && <Loader className={Classes.SKELETON} />}
        {!isFetching && (
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
        {isFetching && <Loader className={Classes.SKELETON} />}
        {!isFetching && (
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
            isLoading={isFetching}
            onClick={updateConfig}
            size="md"
          >
            {createMessage(SUBMIT)}
          </Button>
        </div>
      </FieldWrapper>
    </Wrapper>
  );
}
