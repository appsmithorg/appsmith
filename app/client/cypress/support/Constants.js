export const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
export const TABLE_COLUMN_ORDER_KEY = "tableWidgetColumnOrder";
export const TABLE_DATA_DYNAMIC = `{{[
    {
      "id": 2381224,
      "email": "michael.lawson@reqres.in",
      "userName": "Michael Lawson",
      "productName": "Chicken Sandwich",
      "orderAmount": 4.99
    },
    {
      "id": 2736212,
      "email": "lindsay.ferguson@reqres.in",
      "userName": "Lindsay Ferguson",
      "productName": "Tuna Salad",
      "orderAmount": 9.99
    },
    {
      "id": 6788734,
      "email": "tobias.funke@reqres.in",
      "userName": "Tobias Funke",
      "productName": "Beef steak",
      "orderAmount": 19.99
    },
    {
      "id": 7434532,
      "email": "byron.fields@reqres.in",
      "userName": "Byron Fields",
      "productName": "Chicken Sandwich",
      "orderAmount": 4.99
    },
    {
      "id": 7434532,
      "email": "ryan.holmes@reqres.in",
      "userName": "Ryan Holmes",
      "productName": "Avocado Panini",
      "orderAmount": 7.99
    },
        {
      "id": 7434532,
      "email": "byron.fields@reqres.in",
      "userName": "Byron Fields",
      "productName": "Chicken Sandwich",
      "orderAmount": 4.99
    },
    {
      "id": 7434532,
      "email": "ryan.holmes@reqres.in",
      "userName": "Ryan Holmes",
      "productName": "Avocado Panini",
      "orderAmount": 7.99
    },
        {
      "id": 7434532,
      "email": "byron.fields@reqres.in",
      "userName": "Byron Fields",
      "productName": "Chicken Sandwich",
      "orderAmount": 4.99
    },
    {
      "id": 7434532,
      "email": "ryan.holmes@reqres.in",
      "userName": "Ryan Holmes",
      "productName": "Avocado Panini",
      "orderAmount": 7.99
    },
        {
      "id": 7434532,
      "email": "byron.fields@reqres.in",
      "userName": "Byron Fields",
      "productName": "Chicken Sandwich",
      "orderAmount": 4.99
    },
    {
      "id": 7434532,
      "email": "ryan.holmes@reqres.in",
      "userName": "Ryan Holmes",
      "productName": "Avocado Panini",
      "orderAmount": 7.99
    },
        {
      "id": 7434532,
      "email": "byron.fields@reqres.in",
      "userName": "Byron Fields",
      "productName": "Chicken Sandwich",
      "orderAmount": 4.99
    },
    {
      "id": 7434532,
      "email": "ryan.holmes@reqres.in",
      "userName": "Ryan Holmes",
      "productName": "Avocado Panini",
      "orderAmount": 7.99
    }
  ]}}`;

export const TABLE_DATA_STATIC = `
[
  {
    "id": "#1",
    "task": "Drop a table",
    "status": "✅",
    "action": ""
  },
  {
    "id": "#2",
    "task": "Create a query fetch_users with the Mock DB",
    "status": "--",
    "action": ""
  },
  {
    "id": "#3",
    "task": "Bind the query using => fetch_users.data",
    "status": "--",
    "action": ""
  }
]
`;

export const WALKTHROUGH_TEST_PAGE = "WALKTHROUGH_TEST_PAGE";
export const ANVIL_EDITOR_TEST = "ANVIL_EDITOR_TEST";
export const AI_AGENTS_TEST = "AI_AGENTS_TEST";
export const DEFAULT_COLUMN_NAME = "Table Column";
export const FEATURE_WALKTHROUGH_INDEX_KEY = "FEATURE_WALKTHROUGH";
export const USER_SIGN_UP_INDEX_KEY = "USER_SIGN_UP";

export const LICENSE_FEATURE_FLAGS = ["license_audit_logs_enabled"];
