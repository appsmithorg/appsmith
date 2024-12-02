/** Offset needed to make table height match response tab height */
export const RESPONSE_TABLE_HEIGHT_OFFSET = 14;

export const REACT_JSON_PROPS = {
  name: null,
  enableClipboard: false,
  displayObjectSize: false,
  displayDataTypes: false,
  style: {
    fontFamily: "var(--ads-v2-font-family)",
    fontSize: "11px",
    fontWeight: "400",
    letterSpacing: "-0.195px",
    lineHeight: "13px",
  },
  collapsed: 1,
};

export const API_REACT_JSON_PROPS = { ...REACT_JSON_PROPS, collapsed: 0 };
