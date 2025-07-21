import { Icon } from "@appsmith/ads";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import React from "react";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import useOnUpgrade from "utils/hooks/useOnUpgrade";

const GoldButton = styled.button`
  display: inline-flex;
  min-width: 60px;
  min-height: 24px;
  max-height: 24px;
  padding: 4px 8px;
  justify-content: center;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  border: 1px solid #d3a417;
  background: linear-gradient(135deg, #f3c23a 0%, #d3a417 100%);

  color: #12192b;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;

  &:hover,
  &:focus {
    filter: brightness(0.97);
    outline: none;
  }
`;

const UpgradeButton = () => {
  const { onUpgrade } = useOnUpgrade({});
  const isBusinessOrEnterprise = useFeatureFlag(
    FEATURE_FLAG.license_gac_enabled,
  );

  if (isBusinessOrEnterprise) return null;

  return (
    <GoldButton onClick={onUpgrade}>
      Upgrade
      <Icon name="star-line" size="sm" />
    </GoldButton>
  );
};

export default UpgradeButton;
