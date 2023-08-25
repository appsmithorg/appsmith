import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import type { FeatureParams } from "components/featureWalkthrough/walkthroughContext";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { APPLICATIONS_URL } from "constants/routes";
import type { Dispatch } from "react";
import history from "utils/history";
import { setFeatureWalkthroughShown } from "utils/storage";

export const triggerWelcomeTour = (dispatch: Dispatch<any>) => {
  history.push(APPLICATIONS_URL);
  dispatch({
    type: ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
  });
};

export enum SIGNPOSTING_STEP {
  CONNECT_A_DATASOURCE = "CONNECT_A_DATASOURCE",
  CREATE_A_QUERY = "CREATE_A_QUERY",
  ADD_WIDGETS = "ADD_WIDGETS",
  CONNECT_DATA_TO_WIDGET = "CONNECT_DATA_TO_WIDGET",
  DEPLOY_APPLICATIONS = "DEPLOY_APPLICATIONS",
}

export const SignpostingWalkthroughConfig: Record<string, FeatureParams> = {
  [SIGNPOSTING_STEP.CONNECT_A_DATASOURCE]: {
    targetId: "#add_datasources",
    details: {
      title: "Add New Datasource",
      description: "Datasources can be directly and easily accessed here",
      imageURL: getAssetUrl(`${ASSETS_CDN_URL}/create-datasource.gif`),
    },
    onDismiss: async () => {
      await setFeatureWalkthroughShown(
        FEATURE_WALKTHROUGH_KEYS.add_datasouce,
        true,
      );
    },
    overlayColor: "transparent",
    offset: {
      position: "right",
      top: -100,
      highlightPad: 5,
      indicatorLeft: -3,
      style: {
        transform: "none",
        boxShadow: "var(--ads-v2-shadow-popovers)",
        border: "1px solid var(--ads-v2-color-border-muted)",
      },
    },
    dismissOnOverlayClick: true,
    delay: 1000,
  },
  [SIGNPOSTING_STEP.CREATE_A_QUERY]: {
    targetId: "#create-query",
    details: {
      title: "Add New query",
      description:
        "A new query can be created using this button for this datasource",
      imageURL: getAssetUrl(`${ASSETS_CDN_URL}/create-new-query.gif`),
    },
    onDismiss: async () => {
      await setFeatureWalkthroughShown(
        FEATURE_WALKTHROUGH_KEYS.create_query,
        true,
      );
    },
    offset: {
      position: "bottom",
      highlightPad: 5,
      indicatorLeft: -3,
      left: -200,
      style: {
        transform: "none",
        boxShadow: "var(--ads-v2-shadow-popovers)",
        border: "1px solid var(--ads-v2-color-border-muted)",
      },
    },
    dismissOnOverlayClick: true,
    overlayColor: "transparent",
    delay: 1000,
  },
  BACK_TO_CANVAS: {
    targetId: "#back-to-canvas",
    onDismiss: async () => {
      await setFeatureWalkthroughShown(
        FEATURE_WALKTHROUGH_KEYS.back_to_canvas,
        true,
      );
    },
    details: {
      title: "Go back to canvas",
      description:
        "Go back to the canvas from here to start building the UI for your app using available widgets",
      imageURL: getAssetUrl(`${ASSETS_CDN_URL}/back-to-canvas.gif`),
    },
    offset: {
      position: "bottom",
      left: -200,
      highlightPad: 5,
      indicatorLeft: -3,
      style: {
        transform: "none",
        boxShadow: "var(--ads-v2-shadow-popovers)",
        border: "1px solid var(--ads-v2-color-border-muted)",
      },
    },
    delay: 1000,
    overlayColor: "transparent",
    dismissOnOverlayClick: true,
  },
  EXPLORER_WIDGET_TAB: {
    targetId: `#explorer-tab-options [data-value*="widgets"]`,
    details: {
      title: "Switch to Widgets section",
      description:
        "Segmented View in Entity Explorer enables swift switching between Explorer and Widgets. Select Widgets tab, then click on a widget to bind data",
      imageURL: getAssetUrl(`${ASSETS_CDN_URL}/switch-to-widget.gif`),
    },
    onDismiss: async () => {
      await setFeatureWalkthroughShown(
        FEATURE_WALKTHROUGH_KEYS.switch_to_widget,
        true,
      );
    },
    offset: {
      position: "right",
      highlightPad: 5,
      indicatorLeft: -3,
      style: {
        transform: "none",
        boxShadow: "var(--ads-v2-shadow-popovers)",
        border: "1px solid var(--ads-v2-color-border-muted)",
      },
    },
    dismissOnOverlayClick: true,
    overlayColor: "transparent",
    delay: 1000,
  },
  ADD_TABLE_WIDGET: {
    targetId: `#widget-card-draggable-tablewidgetv2`,
    details: {
      title: "Drag a widget on the canvas",
      description:
        "Drag and drop a table widget onto the canvas and then establish the connection with the Query you previously composed",
      imageURL: getAssetUrl(`${ASSETS_CDN_URL}/add-table-widget.gif`),
    },
    onDismiss: async () => {
      await setFeatureWalkthroughShown(
        FEATURE_WALKTHROUGH_KEYS.add_table_widget,
        true,
      );
    },
    offset: {
      position: "right",
      highlightPad: 5,
      indicatorLeft: -3,
      top: -200,
      style: {
        transform: "none",
        boxShadow: "var(--ads-v2-shadow-popovers)",
        border: "1px solid var(--ads-v2-color-border-muted)",
      },
    },
    delay: 1000,
    overlayColor: "transparent",
    dismissOnOverlayClick: true,
  },
  CONNECT_DATA: {
    targetId: `#table-overlay-connectdata`,
    details: {
      title: "Connect data",
      description:
        "Swiftly bind data to the widget by connecting your query with just a click of this button.",
      imageURL: `${ASSETS_CDN_URL}/connect-data.gif`,
    },
    onDismiss: async () => {
      await setFeatureWalkthroughShown(
        FEATURE_WALKTHROUGH_KEYS.connect_data,
        true,
      );
    },
    offset: {
      position: "right",
      highlightPad: 5,
      indicatorLeft: -3,
      style: {
        transform: "none",
        boxShadow: "var(--ads-v2-shadow-popovers)",
        border: "1px solid var(--ads-v2-color-border-muted)",
      },
    },
    dismissOnOverlayClick: true,
    overlayColor: "transparent",
    delay: 1000,
  },
  DEPLOY_APP: {
    targetId: `#application-publish-btn`,
    details: {
      title: "Deploy 🚀",
      description:
        "Use the deploy button to quickly launch and go live with your creation",
    },
    offset: {
      position: "bottom",
      highlightPad: 5,
      indicatorLeft: -3,
      left: -200,
      style: {
        transform: "none",
        boxShadow: "var(--ads-v2-shadow-popovers)",
        border: "1px solid var(--ads-v2-color-border-muted)",
      },
    },
    onDismiss: async () => {
      await setFeatureWalkthroughShown(FEATURE_WALKTHROUGH_KEYS.deploy, true);
    },
    overlayColor: "transparent",
    dismissOnOverlayClick: true,
    delay: 1000,
  },
};
