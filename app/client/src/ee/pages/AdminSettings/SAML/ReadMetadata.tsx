import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { connect, useDispatch } from "react-redux";
import type { InjectedFormProps } from "redux-form";
import { formValueSelector, reduxForm } from "redux-form";
import _ from "lodash";
import type { AppState } from "@appsmith/reducers";
import { BASE_URL } from "constants/routes";
import { getSettingsSavingState } from "selectors/settingsSelectors";
import SaveAdminSettings from "pages/Settings/SaveSettings";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import CopyUrlForm from "pages/Settings/FormGroup/CopyUrlForm";
import type { InputProps } from "./components";
import { Accordion, BodyContainer, Info, RenderForm } from "./components";
import { getSettingDetail, getSettingLabel } from ".";
import { SSO_IDENTITY_PROVIDER_FORM } from "@appsmith/constants/forms";
import { fetchSamlMetadata } from "@appsmith/actions/settingsAction";
import {
  createMessage,
  ENTITY_ID_TOOLTIP,
  REDIRECT_URL_TOOLTIP,
  MANDATORY_FIELDS_ERROR,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { SAML_SIGNUP_SETUP_DOC } from "constants/ThirdPartyConstants";
import {
  Callout,
  Tab,
  TabPanel,
  Tabs,
  TabsList,
  Text,
  toast,
} from "design-system";
import styled from "styled-components";

const StyledTabs = styled(Tabs)`
  margin: 8px 0 0;

  label:first-child {
    font-weight: 500;
  }
`;

export type MenuItemsProps = {
  id: string;
  key: MENU_ITEM;
  title: string;
  subText: string;
  callout?: string;
  inputs: InputProps[];
  advanced?: InputProps[];
};

export enum MENU_ITEM {
  METADATA_URL = "METADATA_URL",
  XML = "XML",
  IDP_DATA = "IDP_DATA",
}

export const MENU_ITEMS_MAP: MenuItemsProps[] = [
  {
    id: "APPSMITH_SSO_SAML_METADATA_URL",
    key: MENU_ITEM.METADATA_URL,
    title: "Metadata URL",
    subText: "Paste the Metadata URL to retrieve the IdP details.",
    callout: "Cannot locate the Metadata URL?",
    inputs: [
      {
        className: "t--sso-metadata-url-input",
        hint: "Metadata is an XML file which has configuration data used to establish trust between the SP and IDP. Paste the public URL of the XML file that contains the IdP information.",
        label: "Metadata URL",
        name: "metadataUrl",
        isRequired: true,
      },
    ],
    advanced: [
      {
        className: "t--sso-saml-claims",
        label: "Claims",
        name: "claims",
        isRequired: false,
        type: "KeyValueFieldArray",
      },
    ],
  },
  {
    id: "APPSMITH_SSO_SAML_METADATA_XML",
    key: MENU_ITEM.XML,
    title: "XML",
    subText: "Paste the raw Metadata XML to retrieve the IdP details.",
    callout: "Cannot locate raw Metadata XML?",
    inputs: [
      {
        className: "t--sso-metadata-xml-input",
        hint: "Metadata is an XML file which has configuration data used to establish trust between the SP and IDP. Paste the file's text in its entirety here.",
        label: "Metadata XML",
        name: "metadataXml",
        type: "Area",
        isRequired: true,
      },
    ],
    advanced: [
      {
        className: "t--sso-saml-claims",
        label: "Claims",
        name: "claims",
        isRequired: false,
        type: "KeyValueFieldArray",
      },
    ],
  },
  {
    id: "APPSMITH_SSO_SAML_IDP_DATA",
    key: MENU_ITEM.IDP_DATA,
    title: "IdP data",
    subText: "Provide your individual Identity Provider metadata fields.",
    callout: "Cannot locate the individual metadata fields?",
    inputs: [
      {
        className: "t--sso-metadata-entity-id-input",
        hint: "The application-defined unique identifier that is most often the SP Entity ID of your application.",
        label: "Entity ID",
        name: "metadataEntityId",
        isRequired: true,
      },
      {
        className: "t--sso-metadata-sso-url-input",
        hint: "The location where the SAML assertion is sent with a HTTP POST. This is often referred to as the SAML Assertion Consumer Service (ACS) URL for your application.",
        label: "Single sign on URL",
        name: "metadataSsoUrl",
        isRequired: true,
      },
      {
        className: "t--sso-metadata-pub-cert-input",
        hint: "The PEM or DER encoded public key certificate of the Identity Provider used to verify SAML message and assertion signatures.",
        label: "X509 public certificate",
        name: "metadataPubCert",
        isRequired: true,
      },
      {
        className: "t--email-input",
        hint: "Identifies the NameID or Name Identifier which is used to identity the subject of a SAML assertion. Use the NameID format that identifies the email of the user defined in the IdP User Profile.",
        label: "Email",
        name: "metadataEmail",
        isRequired: true,
      },
    ],
    advanced: [
      {
        className: "t--sso-saml-claims",
        label: "Claims",
        name: "claims",
        isRequired: false,
        type: "KeyValueFieldArray",
      },
    ],
  },
];

export type MetadataFormValuesType = {
  metadataPubCert?: string;
  metadataEmail?: string;
  metadataSsoUrl?: string;
  metadataUrl?: string;
  metadataXml?: string;
};

const allSAMLSetupOptions = Object.values(MENU_ITEMS_MAP);

type FormProps = {
  settings: Record<string, any>;
  settingsConfig: Record<string, any>;
  isSaving: boolean;
};

function MetadataForm(
  props: InjectedFormProps &
    FormProps & {
      activeTabIndex: number;
    },
) {
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const dispatch = useDispatch();
  const isSavable = AdminConfig.savableCategories.includes(
    subCategory ?? category,
  );
  const details = getSettingDetail(category, subCategory);
  const pageTitle = getSettingLabel(
    details?.title || (subCategory ?? category),
  );
  const { activeTabIndex = 0 } = props;
  const providerForm = allSAMLSetupOptions[activeTabIndex];

  const onClear = (event?: React.FocusEvent<any, any>) => {
    if (event?.type === "click") {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_RESET", {
        method: pageTitle,
      });
    }
    _.forEach(props.settingsConfig, (value, settingName) => {
      if (settingName !== "claims") {
        props.settingsConfig[settingName] = "";
      }
    });
    if (
      props.settingsConfig["claims"] === "" ||
      props.settingsConfig["claims"]?.length === 0
    ) {
      delete props.settingsConfig["claims"];
    }
    if (activeTabIndex === 2) {
      props.settingsConfig[
        "metadataEntityId"
      ] = `${window.location.origin}${BASE_URL}auth/realms/appsmith`;
    }
    props.initialize(props.settingsConfig);
  };

  useEffect(onClear, [activeTabIndex]);

  const submit = () => {
    const {
      claims,
      metadataEmail,
      metadataEntityId,
      metadataPubCert,
      metadataSsoUrl,
      metadataUrl,
      metadataXml,
    } = props.settings;
    let claimsKeyValueObj = {};
    if (claims) {
      claimsKeyValueObj = {
        claims: claims.reduce(
          (obj: any, item: any) =>
            Object.assign(obj, { [item.key]: item.value }),
          {},
        ),
      };
    }
    if (activeTabIndex === 0 && metadataUrl?.toString().trim()) {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_SAVE", {
        method: pageTitle,
        type: "SAML Metadata URL",
      });
      dispatch(
        fetchSamlMetadata({
          ...(claims ? claimsKeyValueObj : {}),
          isEnabled: true,
          importFromUrl: metadataUrl,
        }),
      );
    } else if (activeTabIndex === 1 && metadataXml?.toString().trim()) {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_SAVE", {
        method: pageTitle,
        type: "SAML Metadata XML",
      });
      dispatch(
        fetchSamlMetadata({
          ...(claims ? claimsKeyValueObj : {}),
          isEnabled: true,
          importFromXml: metadataXml,
        }),
      );
    } else if (
      activeTabIndex === 2 &&
      metadataEmail?.toString().trim() &&
      metadataSsoUrl?.toString().trim() &&
      metadataPubCert?.toString().trim() &&
      metadataEntityId?.toString().trim()
    ) {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_SAVE", {
        method: pageTitle,
        type: "SAML IDP data",
      });
      dispatch(
        fetchSamlMetadata({
          ...(claims ? claimsKeyValueObj : {}),
          isEnabled: true,
          configuration: {
            singleSignOnServiceUrl: metadataSsoUrl,
            signingCertificate: metadataPubCert,
            emailField: metadataEmail,
          },
        }),
      );
    } else {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_ERROR", {
        error: createMessage(MANDATORY_FIELDS_ERROR),
      });
      toast.show(createMessage(MANDATORY_FIELDS_ERROR), {
        kind: "error",
      });
    }
  };

  return (
    <>
      {providerForm.callout && (
        <Callout
          kind="info"
          links={[
            {
              children: "Read documentation",
              to: SAML_SIGNUP_SETUP_DOC,
            },
          ]}
        >
          {providerForm.callout}
        </Callout>
      )}
      <Info color="var(--ads-v2-color-fg)" renderAs="h3">
        {providerForm.subText}
      </Info>
      <RenderForm inputs={providerForm.inputs} />
      <Accordion label="Advanced" settings={providerForm.advanced} />
      {isSavable && (
        <SaveAdminSettings
          isSaving={props.isSaving}
          onClear={onClear}
          onSave={submit}
          settings={props.settings}
          valid={props.valid}
        />
      )}
    </>
  );
}

const validate = (values: Record<string, any>) => {
  const errors: any = {};
  _.filter(values, (value, name) => {
    const message = AdminConfig.validate(name, value);
    if (message) {
      errors[name] = message;
    }
  });
  return errors;
};

const selector = formValueSelector(SSO_IDENTITY_PROVIDER_FORM);

const MetadataReduxForm = connect(
  (
    state: AppState,
    props: {
      activeTabIndex: number;
    },
  ) => {
    const newProps: any = {
      settings: {},
      settingsConfig: {
        claims: [{ key: "", value: "" }],
      },
      isSaving: getSettingsSavingState(state),
    };
    _.forEach(MENU_ITEMS_MAP, (setting, index) => {
      if (index === props.activeTabIndex) {
        _.forEach(setting.inputs, (input) => {
          const fieldValue = selector(state, input.name);
          if (fieldValue !== newProps.settingsConfig[input.name]) {
            newProps.settings[input.name] = fieldValue;
          }
        });
        _.forEach(setting.advanced, (input) => {
          const fieldValue = selector(state, input.name);
          if (
            JSON.stringify(fieldValue) !==
            JSON.stringify(newProps.settingsConfig[input.name])
          ) {
            newProps.settings[input.name] = fieldValue;
          }
        });
      }
    });
    return newProps;
  },
  null,
)(
  reduxForm<any, any>({
    validate,
    form: SSO_IDENTITY_PROVIDER_FORM,
    touchOnBlur: true,
    enableReinitialize: true,
  })(MetadataForm),
);

function ReadMetadata() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<string>(MENU_ITEMS_MAP[0].key);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setActiveTabIndex(allSAMLSetupOptions.findIndex((t) => t.key === tab));
  };

  return (
    <>
      <CopyUrlForm
        fieldName="redirect-url-form"
        helpText={"Paste this URL in your IdP service providers console."}
        title={"Redirect URL"}
        tooltip={createMessage(REDIRECT_URL_TOOLTIP)}
        value={`${BASE_URL}auth/realms/appsmith/broker/saml/endpoint`}
      />
      {activeTabIndex !== 2 && (
        <CopyUrlForm
          fieldName="entity-id--url-form"
          helpText={"Paste this URL in your IdP service providers console."}
          title={"Entity ID"}
          tooltip={createMessage(ENTITY_ID_TOOLTIP)}
          value={`${BASE_URL}auth/realms/appsmith`}
        />
      )}
      <Text kind="heading-m" renderAs="h3">
        Register Identity Provider
      </Text>
      <StyledTabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {MENU_ITEMS_MAP.map((tab) => {
            return (
              <Tab
                data-testid={`t--tab-${tab.key}`}
                key={tab.key}
                value={tab.key}
              >
                {tab.title}
              </Tab>
            );
          })}
        </TabsList>
        {MENU_ITEMS_MAP.map((tab, index) => {
          return (
            <TabPanel key={tab.key} value={tab.key}>
              <BodyContainer>
                <MetadataReduxForm activeTabIndex={index} />
              </BodyContainer>
            </TabPanel>
          );
        })}
      </StyledTabs>
    </>
  );
}

export default ReadMetadata;
