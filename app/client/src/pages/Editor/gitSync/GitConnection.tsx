import React, { useState } from "react";
import { Subtitle, Title, Space } from "./components/StyledComponents";
import {
  CONNECT_TO_GIT,
  CONNECT_TO_GIT_SUBTITLE,
  REMOTE_URL_VIA,
  createMessage,
} from "constants/messages";
import OptionSelector from "./components/OptionSelector";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import TextInput from "components/ads/TextInput";
import { ReactComponent as CheckIcon } from "assets/icons/ads/check.svg";
import { ReactComponent as LinkIcon } from "assets/icons/ads/link_2.svg";
import UserGitProfileSettings from "./components/UserGitProfileSettings";
import { DropdownOption } from "components/ads/Dropdown";
import { AUTH_TYPE_OPTIONS } from "./constants";
import { DropdownOnSelect } from "../../../components/ads/Dropdown";

const UrlOptionContainer = styled.div`
  ${(props) => getTypographyByKey(props, "h6")};
  display: flex;
  align-items: center;
  & .label {
    position: relative;
    top: 1px;
  }
`;

const CheckContainer = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  padding: ${(props) => props.theme.spaces[2]}px;
  padding-left: 0;
`;

const UrlContainer = styled.div`
  width: 70%;
  display: flex;
  align-items: center;
`;

function GitConnection() {
  const [selectedAuthType, setSelectedAuthType] = useState<DropdownOption>(
    AUTH_TYPE_OPTIONS[0],
  );

  const onSelectAuthType: DropdownOnSelect = (value, dropdownOption) => {
    setSelectedAuthType(dropdownOption);
  };

  return (
    <>
      <Title>{createMessage(CONNECT_TO_GIT)}</Title>
      <Subtitle>{createMessage(CONNECT_TO_GIT_SUBTITLE)}</Subtitle>
      <UrlOptionContainer>
        <span className="label">{`${createMessage(REMOTE_URL_VIA)} `}</span>
        <OptionSelector
          onSelect={onSelectAuthType}
          options={AUTH_TYPE_OPTIONS}
          selected={selectedAuthType}
        />
      </UrlOptionContainer>
      <UrlContainer>
        <TextInput
          fill
          rightSideComponent={
            <CheckContainer>
              <CheckIcon />
            </CheckContainer>
          }
        />
        <LinkIcon />
      </UrlContainer>
      <Space size={12} />
      <UserGitProfileSettings authType={selectedAuthType.label || ""} />
    </>
  );
}

export default GitConnection;
