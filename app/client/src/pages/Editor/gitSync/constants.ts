import { TabProp } from "components/ads/Tabs";
import {
  createMessage,
  GIT_CONNECTION,
  DEPLOY,
  MERGE,
  SHARE_APPLICATION,
  SETTINGS,
} from "constants/messages";

export enum MENU_ITEM {
  GIT_CONNECTION = "GIT_CONNECTION",
  DEPLOY = "DEPLOY",
  MERGE = "MERGE",
  SHARE_APPLICATION = "SHARE_APPLICATION",
  SETTINGS = "SETTINGS",
}

export const MENU_ITEMS: TabProp[] = [
  {
    key: MENU_ITEM.GIT_CONNECTION,
    title: createMessage(GIT_CONNECTION),
  },
  {
    key: MENU_ITEM.DEPLOY,
    title: createMessage(DEPLOY),
  },
  {
    key: MENU_ITEM.MERGE,
    title: createMessage(MERGE),
  },
  {
    key: MENU_ITEM.SHARE_APPLICATION,
    title: createMessage(SHARE_APPLICATION),
  },
  {
    key: MENU_ITEM.SETTINGS,
    title: createMessage(SETTINGS),
  },
];

export const AuthTypeOptions = [
  { label: "SSH", value: "SSH" },
  { label: "HTTPS", value: "HTTPS" },
];
