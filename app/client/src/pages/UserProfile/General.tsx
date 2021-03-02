import React from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import TextInput, { notEmptyValidator } from "components/ads/TextInput";
import FilePicker from "components/ads/FilePicker";
import { useSelector } from "react-redux";
import { getCurrentError } from "selectors/organizationSelectors";

const Wrapper = styled.div`
  & > div {
    margin-top: 27px;
  }
`;
const FieldWrapper = styled.div`
  width: 520px;
  display: flex;
`;

const InputWrapper = styled.div`
  width: 520px;
  display: flex;
  align-items: center;
`;

const LabelWrapper = styled.div`
  width: 200px;
  display: flex;
`;

const ForgotPassword = styled.a`
  margin-top: 12px;
  border-bottom: 1px solid transparent;
  &:hover {
    cursor: pointer;
    text-decoration: none;
  }
  display: inline-block;
`;

const General = () => {
  const DeleteLogo = () => null;

  const logoUploadError = useSelector(getCurrentError);

  return (
    <Wrapper>
      <InputWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Display name</Text>
        </LabelWrapper>
        <TextInput
          validator={notEmptyValidator}
          placeholder="Display name"
          onChange={() => null}
          defaultValue={"Display name"}
          cypressSelector="t--display-name"
        ></TextInput>
      </InputWrapper>
      <FieldWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Email</Text>
        </LabelWrapper>
        <div style={{ flexDirection: "column", display: "flex" }}>
          <Text type={TextType.P1}>test@appsmith.com</Text>

          <ForgotPassword>Reset Password</ForgotPassword>
        </div>
      </FieldWrapper>
      <FieldWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Display Picture</Text>
        </LabelWrapper>
        <FilePicker
          url={""}
          onFileRemoved={DeleteLogo}
          logoUploadError={logoUploadError.message}
        />
      </FieldWrapper>
      <InputWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Website</Text>
        </LabelWrapper>
        <TextInput
          placeholder=""
          onChange={() => null}
          defaultValue={""}
          cypressSelector="t--profile-website"
        />
      </InputWrapper>
    </Wrapper>
  );
};

export default General;
