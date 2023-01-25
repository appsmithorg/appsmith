export * from "ce/utils/autocomplete/EntityDefinitions";

import { GLOBAL_FUNCTIONS as CE_GLOBAL_FUNCTIONS } from "ce/utils/autocomplete/EntityDefinitions";

export const GLOBAL_FUNCTIONS = {
  ...CE_GLOBAL_FUNCTIONS,
  windowMessageListener: {
    "!doc": "Subscribe to messages from parent window",
    "!type": "fn(origin: string, callback: fn) -> void",
  },
  unlistenWindowMessage: {
    "!doc": "Unsubscribe to messages from parent window",
    "!type": "fn(origin: string) -> void",
  },
};
