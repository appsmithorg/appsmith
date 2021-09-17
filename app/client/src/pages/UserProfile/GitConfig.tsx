import React, { useEffect, useState } from "react";
import {
  Wrapper,
  FieldWrapper,
  LabelWrapper,
  Loader,
  TextLoader,
} from "./StyledComponents";
import {
  createMessage,
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  SUBMIT,
} from "constants/messages";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "@blueprintjs/core";
import TextInput, { notEmptyValidator } from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  getGlobalGitConfig,
  getIsFetchingGlobalGitConfig,
} from "selectors/gitSyncSelectors";
import {
  fetchGlobalGitConfigInit,
  updateGlobalGitConfigInit,
} from "actions/gitSyncActions";

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
    setAuthorName(globalGitConfig.authorName);
    setAuthorEmail(globalGitConfig.authorEmail);
  }, [globalGitConfig]);

  const updateConfig = () => {
    setAreFormValuesUpdated(false);
    dispatch(updateGlobalGitConfigInit({ authorName, authorEmail }));
  };

  useEffect(() => {
    dispatch(fetchGlobalGitConfigInit());
  }, []);

  return (
    <Wrapper>
      <FieldWrapper>
        <LabelWrapper>
          {!isFetching && (
            <Text type={TextType.H4}>{createMessage(AUTHOR_NAME)}</Text>
          )}
          {isFetching && <TextLoader className={Classes.SKELETON} />}
        </LabelWrapper>
        {isFetching && <Loader className={Classes.SKELETON} />}
        {!isFetching && (
          <div style={{ flex: 1 }}>
            <TextInput
              cypressSelector="t--git-author-name"
              defaultValue={authorName}
              fill={false}
              onChange={setAuthorName}
              placeholder={createMessage(AUTHOR_NAME)}
              validator={notEmptyValidator}
            />
          </div>
        )}
      </FieldWrapper>
      <FieldWrapper>
        <LabelWrapper>
          {!isFetching && (
            <Text type={TextType.H4}>{createMessage(AUTHOR_EMAIL)}</Text>
          )}
          {isFetching && <TextLoader className={Classes.SKELETON} />}
        </LabelWrapper>
        {isFetching && <Loader className={Classes.SKELETON} />}
        {!isFetching && (
          <div style={{ flex: 1 }}>
            <TextInput
              cypressSelector="t--git-author-email"
              defaultValue={authorEmail}
              fill={false}
              onChange={setAuthorEmail}
              placeholder={createMessage(AUTHOR_EMAIL)}
              validator={notEmptyValidator}
            />
          </div>
        )}
      </FieldWrapper>
      <FieldWrapper>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <Button
            category={Category.primary}
            disabled={isSubmitDisabled}
            isLoading={isFetching}
            onClick={updateConfig}
            size={Size.medium}
            tag="button"
            text={createMessage(SUBMIT)}
          />
        </div>
      </FieldWrapper>
    </Wrapper>
  );
}
