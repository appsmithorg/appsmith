import Icon, { IconSize } from "components/ads/Icon";
import { Text, Case, FontWeight, TextType } from "design-system";
import { TooltipComponent } from "design-system";
import { Colors } from "constants/Colors";
import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { CREDENTIAL_MODE } from "../constants";
import { Classes as AdsClasses } from "components/ads/common";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";

const Container = styled.div`
  margin-top: ${(props) => props.theme.spaces[7]}px;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

export const Radio = styled.label<{
  disabled?: boolean;
  columns?: number;
  rows?: number;
  backgroundColor?: string;
}>`
  display: block;
  position: relative;
  padding-left: ${(props) => props.theme.spaces[12] - 2}px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-size: ${(props) => props.theme.typography.p1.fontSize}px;
  font-weight: ${(props) => props.theme.typography.p1.fontWeight};
  line-height: ${(props) => props.theme.typography.p1.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.p1.letterSpacing}px;
  color: ${(props) => props.theme.colors.radio.text};
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  ${(props) =>
    props.columns && props.columns > 0
      ? `
        flex-basis: calc(100% / ${props.columns});
        `
      : props.rows && props.rows > 0
      ? `
        margin-bottom: ${props.theme.spaces[11] + 1}px;`
      : null};

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  .checkbox {
    position: absolute;
    top: 0;
    left: 0;
    width: ${(props) => props.theme.spaces[8]}px;
    height: ${(props) => props.theme.spaces[8]}px;
    background-color: transparent;
    border: ${(props) => props.theme.spaces[1] - 2}px solid ${Colors.BLACK};
    border-radius: 50%;
    margin-top: ${(props) => props.theme.spaces[0]}px;
  }

  .checkbox:after {
    content: "";
    position: absolute;
    display: none;
  }

  input:checked ~ .checkbox:after {
    display: block;
  }

  input:disabled ~ .checkbox:after {
    background-color: ${(props) => props.theme.colors.radio.disabled};
  }

  .checkbox:after {
    content: "";
    position: absolute;
    width: ${(props) => props.theme.spaces[4]}px;
    height: ${(props) => props.theme.spaces[4]}px;
    ${(props) =>
      props.disabled
        ? `background-color: ${props.theme.colors.radio.disabled}`
        : `background-color: ${props.backgroundColor || Colors.BLACK};`};
    top: ${(props) => props.theme.spaces[1] - 2}px;
    left: ${(props) => props.theme.spaces[1] - 2}px;
    border-radius: 50%;
  }
`;

const LabelWrapper = styled.div``;
const Row = styled.div`
  display: flex;
  margin-bottom: 5px;
  .${AdsClasses.TEXT} {
    margin-right: ${(props) => props.theme.spaces[2]}px;
  }
`;

const LinkText = styled.div`
  cursor: pointer;
  .${AdsClasses.ICON} {
    margin-right: ${(props) => props.theme.spaces[3]}px;
    display: inline-flex;
  }
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

function LabelWithHelper(props: { label: string; tooltip: string }) {
  return (
    <Row>
      <Text type={TextType.P1}>{props.label}</Text>
      <TooltipComponent content={props.tooltip}>
        <Icon
          fillColor={Colors.DARK_GRAY}
          name="help-fill"
          size={IconSize.XL}
        />
      </TooltipComponent>
    </Row>
  );
}

export default function CredentialMode(props: {
  defaultValue: string;
  onSelect?: (value: CREDENTIAL_MODE) => void;
}) {
  const [selected, setSelected] = useState(props.defaultValue);

  useEffect(() => {
    setSelected(props.defaultValue);
  }, [props.defaultValue]);

  const onChangeHandler = (value: CREDENTIAL_MODE) => {
    setSelected(value);
    props.onSelect && props.onSelect(value);
  };

  const downloadJson = useCallback(() => {
    window.open(DOCS_BASE_URL, "_blank");
  }, []);

  return (
    <Container>
      <Radio>
        <LabelWrapper>
          <LabelWithHelper label="Add Manually" tooltip="Manually" />
          <Row>
            <Text type={TextType.P3}>
              Choose the datasource and add the missing credentials
            </Text>
          </Row>
        </LabelWrapper>
        <input
          checked={selected === CREDENTIAL_MODE.MANUALLY}
          name="radio"
          onChange={() => onChangeHandler(CREDENTIAL_MODE.MANUALLY)}
          type="radio"
          value={CREDENTIAL_MODE.MANUALLY}
        />
        <span className="checkbox" />
      </Radio>
      <Radio>
        <LabelWrapper>
          <LabelWithHelper label="Import from JSON" tooltip="JSON" />
          <Row>
            <Text type={TextType.P3}>Upload using JSON Block</Text>
          </Row>
          <Row style={{ marginTop: 2 }}>
            <LinkText onClick={downloadJson}>
              <Icon
                fillColor="#B3B3B3"
                name="download-line"
                size={IconSize.SMALL}
              />
              <Text
                case={Case.UPPERCASE}
                color="#B3B3B3"
                type={TextType.P3}
                weight={FontWeight.BOLD}
              >
                DOWNLOAD SAMPLE JSON
              </Text>
            </LinkText>
          </Row>
        </LabelWrapper>
        <input
          checked={selected === CREDENTIAL_MODE.IMPORT_JSON}
          name="radio"
          onChange={() => onChangeHandler(CREDENTIAL_MODE.IMPORT_JSON)}
          type="radio"
          value={CREDENTIAL_MODE.IMPORT_JSON}
        />
        <span className="checkbox" />
      </Radio>
    </Container>
  );
}
