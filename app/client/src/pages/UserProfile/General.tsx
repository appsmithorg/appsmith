import React from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import TextInput, { notEmptyValidator } from "components/ads/TextInput";
import FilePicker from "components/ads/FilePicker";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentError } from "selectors/organizationSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { forgotPasswordSubmitHandler } from "pages/UserAuth/helpers";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { FORGOT_PASSWORD_SUCCESS_TEXT } from "constants/messages";

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
  const user = useSelector(getCurrentUser);
  const dispatch = useDispatch();
  const DeleteLogo = () => null;
  const forgotPassword = async () => {
    try {
      await forgotPasswordSubmitHandler({ email: user?.email }, dispatch);
      Toaster.show({
        text: `${FORGOT_PASSWORD_SUCCESS_TEXT} ${user?.email}`,
        variant: Variant.success,
      });
    } catch (error) {
      Toaster.show({
        text: error._error,
        variant: Variant.success,
      });
    }
  };

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
          defaultValue={user?.name}
          cypressSelector="t--display-name"
        ></TextInput>
      </InputWrapper>
      <FieldWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Email</Text>
        </LabelWrapper>
        <div style={{ flexDirection: "column", display: "flex" }}>
          <Text type={TextType.P1}>{user?.email}</Text>

          <ForgotPassword onClick={forgotPassword}>
            Reset Password
          </ForgotPassword>
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
          placeholder="Your website"
          onChange={() => null}
          defaultValue={""}
          cypressSelector="t--profile-website"
        />
      </InputWrapper>
    </Wrapper>
  );
};

export default General;
