import {
  APP_METADATA_SETTING,
  createMessage,
} from "@appsmith/constants/messages";
import { Text, TextInput, TextType } from "design-system-old";

import React from "react";
import styled from "styled-components";
import SwitchSetting from "./NavigationSettings/SwitchSetting";

const SettingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  color: var(--appsmith-color-black-800);

  .import-btn {
    width: 40%;
  }
  textarea {
    border: 1px solid var(--appsmith-color-black-300);
    border-radius: 4px;
    padding: 8px;
    resize: vertical;
  }
`;

export function AppMetadataSettings() {
  return (
    <SettingWrapper>
      <Text type={TextType.P1}>{APP_METADATA_SETTING.descriptionLabel()}</Text>
      <textarea
        rows={4}
        value={
          "Fulfill the orders placed by customers. Pick items from warehouse, print invoices and labels, ship items, track delivery and returns."
        }
      />

      <Text type={TextType.P1}>{APP_METADATA_SETTING.tagsLabel()}</Text>
      <TextInput fill value={"Order Management"} />

      <Text type={TextType.P1}>{APP_METADATA_SETTING.categoryLabel()}</Text>
      <TextInput fill value={"Operations"} />

      <Text type={TextType.P1}>
        {APP_METADATA_SETTING.imageUrlOnWebsiteLabel()}
      </Text>
      <TextInput
        fill
        value={
          "https://s3.us-east-2.amazonaws.com/template.appsmith.com/order-fulfillment-tracker.png"
        }
      />

      <SwitchSetting
        keyName="showNavbar"
        label={createMessage(APP_METADATA_SETTING.allowPageImportLabel)}
        updateSetting={() => {
          return false;
        }}
        value
      />
      <hr />

      <Text type={TextType.H1}>{APP_METADATA_SETTING.forWebsiteLabel()}</Text>

      <SwitchSetting
        keyName="showNavbar"
        label={createMessage(APP_METADATA_SETTING.isFeaturedOnWebsiteLabel)}
        updateSetting={() => {
          return false;
        }}
        value
      />

      <Text type={TextType.P1}>
        {APP_METADATA_SETTING.excerptOnWebsiteLabel()}
      </Text>
      <TextInput
        fill
        value={
          "Fulfill the orders placed by customers. Pick items from warehouse, print invoices and labels, ship items, track delivery and returns."
        }
      />

      <Text type={TextType.P1}>
        {APP_METADATA_SETTING.mdTextOnWebsiteLabel()}
      </Text>
      <textarea
        rows={4}
        value={
          "* Track Order Metrics\n * QR Scanner to pick and pack products\n * Order status tracker \n * Invoice & Delivery Label pdf printer\n * Manage products, returns and customers"
        }
      />

      <Text type={TextType.P1}>
        {APP_METADATA_SETTING.imageUrlOnWebsiteLabel()}
      </Text>
      <TextInput
        fill
        value={
          "https://s3.us-east-2.amazonaws.com/template.appsmith.com/order-fulfillment-tracker.png"
        }
      />
    </SettingWrapper>
  );
}
