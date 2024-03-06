export * from "ce/pages/Applications/PrivateEmbedSettings";
import { DOCUMENTATION, createMessage } from "@appsmith/constants/messages";
import { EMBED_PRIVATE_APPS_DOC } from "constants/ThirdPartyConstants";
import { Link, Radio, RadioGroup, Text } from "design-system";
import React from "react";

const options = [
  {
    label: "OIDC",
    value: "oidc",
  },
  {
    label: "SAML",
    value: "saml",
  },
];

export const PrivateEmbedSettings = (props: {
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
}) => {
  const { selectedMethod, setSelectedMethod } = props;
  return (
    <div data-testid="t--sso-methods">
      <div className="flex items-center justify-between mb-2">
        <Text>SSO Method</Text>
        <Link
          data-testid="t--documentation-link"
          endIcon="share-box-line"
          target="_blank"
          to={EMBED_PRIVATE_APPS_DOC}
        >
          {createMessage(DOCUMENTATION)}
        </Link>
      </div>
      <RadioGroup
        defaultValue={selectedMethod}
        onChange={(value: string) => setSelectedMethod(value)}
      >
        {options.map((option) => (
          <Radio key={option.value} value={option.value}>
            {option.label}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
};
