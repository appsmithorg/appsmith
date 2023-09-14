import FormTextField from "components/utils/ReduxFormTextField";
import { createMessage } from "@appsmith/constants/messages";
import React from "react";
import type { SettingComponentProps } from "./Common";
import BusinessTag from "components/BusinessTag";
import EnterpriseTag from "components/EnterpriseTag";
import styled from "styled-components";

const LabelWrapper = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export default function TextInput({ setting }: SettingComponentProps) {
  const inputLabel = setting.label ? (
    <LabelWrapper>
      <section>{setting.label} </section>
      {setting.isFeatureEnabled === false &&
        (setting.isEnterprise === true ? <EnterpriseTag /> : <BusinessTag />)}
    </LabelWrapper>
  ) : (
    ""
  );
  return (
    <div
      className={`t--admin-settings-text-input t--admin-settings-${
        setting.name || setting.id
      } mb-4`}
    >
      <FormTextField
        description={setting.subText || ""}
        disabled={setting.isFeatureEnabled === false}
        isRequired={setting.isRequired}
        label={inputLabel}
        name={setting.name || setting.id || ""}
        placeholder={createMessage(() => setting.placeholder || "")}
        type={setting.controlSubType}
      />
    </div>
  );
}
