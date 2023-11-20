import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import produce from "immer";
import { noop, set } from "lodash";

import { CommonControls } from "./CommonControls";
import { ConnectData } from "./ConnectData";
import { DatasourceSpecificControls } from "./DatasourceSpecificControls";
import { Wrapper } from "./styles";
import WidgetSpecificControls from "./WidgetSpecificControls";
import { useDispatch, useSelector } from "react-redux";
import {
  getisOneClickBindingConnectingForWidget,
  getIsOneClickBindingOptionsVisibility,
  getOneClickBindingConfigForWidget,
} from "selectors/oneClickBindingSelectors";
import { updateOneClickBindingOptionsVisibility } from "actions/oneClickBindingActions";
import type { AlertMessage, Alias, OtherField } from "./types";
import {
  CONNECT_BUTTON_TEXT,
  CUSTOMIZE_ONE_CLICK_DATA_DESC,
  CUSTOMIZE_ONE_CLICK_DATA_TITLE,
  createMessage,
} from "@appsmith/constants/messages";

import { DROPDOWN_VARIANT } from "./CommonControls/DatasourceDropdown/types";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  getFeatureWalkthroughShown,
  isUserSignedUpFlagSet,
  setFeatureWalkthroughShown,
} from "utils/storage";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

interface WidgetQueryGeneratorFormContextType {
  widgetId: string;
  propertyValue: string;
  propertyName: string;
  config: {
    datasource: string;
    table: string;
    alias: Record<string, string>;
    sheet: string;
    searchableColumn: string;
    tableHeaderIndex: number;
    datasourcePluginType: string;
    datasourcePluginName: string;
    datasourceConnectionMode: string;
    selectedColumns?: string[];
    otherFields?: Record<string, unknown>;
  };
  updateConfig: (
    property: string | Record<string, unknown>,
    value?: unknown,
  ) => void;
  addBinding: (binding?: string, makeDynamicPropertyPath?: boolean) => void;
  isSourceOpen: boolean;
  onSourceClose: () => void;
  errorMsg: string;
  expectedType: string;
  sampleData: string;
  aliases: Alias[];
  otherFields: OtherField[];
  excludePrimaryColumnFromQueryGeneration?: boolean;
  isConnectableToWidget?: boolean;
  datasourceDropdownVariant: DROPDOWN_VARIANT;
  alertMessage?: AlertMessage | null;
  showEditFieldsModal?: boolean;
}

const DEFAULT_CONFIG_VALUE = {
  datasource: "",
  table: "",
  sheet: "",
  alias: {},
  searchableColumn: "",
  tableHeaderIndex: 1,
  datasourcePluginType: "",
  datasourcePluginName: "",
  datasourceConnectionMode: "",
  otherFields: {},
};

const DEFAULT_CONTEXT_VALUE = {
  config: DEFAULT_CONFIG_VALUE,
  updateConfig: noop,
  addBinding: noop,
  widgetId: "",
  propertyValue: "",
  isSourceOpen: false,
  onSourceClose: noop,
  errorMsg: "",
  propertyName: "",
  expectedType: "",
  sampleData: "",
  aliases: [],
  otherFields: [],
  excludePrimaryColumnFromQueryGeneration: false,
  isConnectableToWidget: false,
  datasourceDropdownVariant: DROPDOWN_VARIANT.CONNECT_TO_DATASOURCE,
  alertMessage: null,
};

export const WidgetQueryGeneratorFormContext =
  React.createContext<WidgetQueryGeneratorFormContextType>(
    DEFAULT_CONTEXT_VALUE,
  );

interface Props {
  propertyPath: string;
  propertyValue: string;
  onUpdate: (snippet?: string, makeDynamicPropertyPath?: boolean) => void;
  widgetId: string;
  errorMsg: string;
  expectedType: string;
  aliases: Alias[];
  searchableColumn: boolean;
  sampleData: string;
  showEditFieldsModal?: boolean;
  excludePrimaryColumnFromQueryGeneration?: boolean;
  otherFields?: OtherField[];
  isConnectableToWidget?: boolean;
  datasourceDropdownVariant: DROPDOWN_VARIANT;
  actionButtonCtaText?: string;
  alertMessage?: AlertMessage;
}

function WidgetQueryGeneratorForm(props: Props) {
  const dispatch = useDispatch();

  const [pristine, setPristine] = useState(true);

  const {
    actionButtonCtaText = createMessage(CONNECT_BUTTON_TEXT),
    alertMessage,
    aliases,
    datasourceDropdownVariant,
    errorMsg,
    excludePrimaryColumnFromQueryGeneration,
    expectedType,
    isConnectableToWidget,
    onUpdate,
    otherFields = [],
    propertyPath,
    propertyValue,
    sampleData,
    searchableColumn,
    showEditFieldsModal = false,
    widgetId,
  } = props;

  const isSourceOpen = useSelector(getIsOneClickBindingOptionsVisibility);

  const formData = useSelector(getOneClickBindingConfigForWidget(widgetId));

  const isConnecting = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  let formState = {
    ...DEFAULT_CONFIG_VALUE,
  };

  if (formData) {
    formState = {
      ...formState,
      datasource: formData.datasourceId,
      table: formData.tableName,
      searchableColumn: formData.searchableColumn,
    };
  }

  const onSourceClose = useCallback(() => {
    dispatch(updateOneClickBindingOptionsVisibility(false));
  }, [dispatch]);

  const [config, setConfig] = useState({
    ...formState,
    widgetId,
  });

  const updateConfig = (
    property: string | Record<string, unknown>,
    value?: unknown,
  ) => {
    setPristine(false);

    setConfig(
      produce(config, (draftConfig) => {
        if (
          property === "datasource" ||
          (typeof property === "object" &&
            Object.keys(property).includes("datasource"))
        ) {
          set(draftConfig, "table", "");
          set(draftConfig, "sheet", "");
          set(draftConfig, "searchableColumn", "");
          set(draftConfig, "alias", {});
          set(draftConfig, "datasourcePluginType", "");
          set(draftConfig, "datasourcePluginName", "");
          set(draftConfig, "datasourceConnectionMode", "");
        }

        if (
          property === "table" ||
          (typeof property === "object" &&
            Object.keys(property).includes("table"))
        ) {
          set(draftConfig, "sheet", "");
          set(draftConfig, "searchableColumn", "");
          set(draftConfig, "alias", {});
        }

        if (
          property === "sheet" ||
          (typeof property === "object" &&
            Object.keys(property).includes("sheet"))
        ) {
          set(draftConfig, "searchableColumn", "");
          set(draftConfig, "alias", {});
        }

        if (typeof property === "string") {
          set(draftConfig, property, value);
        } else {
          Object.entries(property).forEach(([name, value]) => {
            set(draftConfig, name, value);
          });
        }
      }),
    );
  };

  const addBinding = useCallback(
    (binding?: string, makeDynamicPropertyPath?: boolean) => {
      onUpdate(binding, makeDynamicPropertyPath);
    },
    [onUpdate],
  );

  const contextValue = useMemo(() => {
    return {
      config: {
        ...config,
      },
      updateConfig,
      addBinding,
      propertyValue,
      widgetId,
      isSourceOpen,
      onSourceClose,
      errorMsg,
      propertyName: propertyPath,
      expectedType,
      sampleData,
      aliases,
      otherFields,
      excludePrimaryColumnFromQueryGeneration,
      isConnectableToWidget,
      datasourceDropdownVariant,
      alertMessage,
      showEditFieldsModal,
    };
  }, [
    config,
    updateConfig,
    addBinding,
    propertyValue,
    widgetId,
    isSourceOpen,
    onSourceClose,
    errorMsg,
    propertyPath,
    sampleData,
    aliases,
    otherFields,
    excludePrimaryColumnFromQueryGeneration,
    isConnectableToWidget,
    datasourceDropdownVariant,
    alertMessage,
    showEditFieldsModal,
  ]);

  useEffect(() => {
    if (!pristine && propertyValue && !isConnecting) {
      updateConfig("datasource", "");
      checkAndShowWalkthrough();
    }
  }, [isConnecting]);

  const { pushFeature } = useContext(WalkthroughContext) || {};

  const user = useSelector(getCurrentUser);

  const isFeatureEnabled = useFeatureFlag(
    "ab_one_click_learning_popover_enabled",
  );

  const checkAndShowWalkthrough = async () => {
    if (!pushFeature) return;
    if (!isFeatureEnabled) return;
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.customize_one_click_data,
    );
    if (isFeatureWalkthroughShown) return;
    const isNewUser = user && (await isUserSignedUpFlagSet(user.email));
    if (!isNewUser) return;
    pushFeature({
      targetId: `[data-guided-tour-iid='${propertyPath}']`,
      onDismiss: async () => {
        await setFeatureWalkthroughShown(
          FEATURE_WALKTHROUGH_KEYS.customize_one_click_data,
          true,
        );
      },
      details: {
        description: createMessage(CUSTOMIZE_ONE_CLICK_DATA_DESC),
        title: createMessage(CUSTOMIZE_ONE_CLICK_DATA_TITLE),
        videoURL: getAssetUrl(`${ASSETS_CDN_URL}/binding_customization.mp4`),
      },
      offset: {
        position: "left",
        left: -10,
        highlightPad: 5,
        indicatorLeft: 100,
        style: {
          transform: "none",
        },
      },
      eventParams: {
        [FEATURE_WALKTHROUGH_KEYS.customize_one_click_data]: true,
      },
      delay: 100,
    });
  };

  return (
    <Wrapper>
      <WidgetQueryGeneratorFormContext.Provider value={contextValue}>
        <CommonControls />
        <DatasourceSpecificControls />
        <WidgetSpecificControls
          aliases={aliases}
          hasSearchableColumn={searchableColumn}
          otherFields={otherFields}
        />
        <ConnectData btnText={actionButtonCtaText} />
      </WidgetQueryGeneratorFormContext.Provider>
    </Wrapper>
  );
}

export default WidgetQueryGeneratorForm;
