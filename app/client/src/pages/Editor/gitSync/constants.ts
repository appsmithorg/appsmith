import { TabProp } from "components/ads/Tabs";
import {
  createMessage,
  GIT_CONNECTION,
  DEPLOY,
  MERGE,
  SHARE_APPLICATION,
  SETTINGS,
} from "constants/messages";

export const MENU_ITEMS: TabProp[] = [
  {
    key: "GIT_CONNECTION",
    title: createMessage(GIT_CONNECTION),
  },
  {
    key: "DEPLOY",
    title: createMessage(DEPLOY),
  },
  {
    key: "MERGE",
    title: createMessage(MERGE),
  },
  {
    key: "SHARE_APPLICATION",
    title: createMessage(SHARE_APPLICATION),
  },
  {
    key: "SETTINGS",
    title: createMessage(SETTINGS),
  },
];
