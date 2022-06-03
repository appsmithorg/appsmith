export const DATASOURCE_CONSTANT = "DATASOURCE";
export const APPSMITH_IP_ADDRESSES = ["18.223.74.85", "3.131.104.27"];
export const PRIMARY_KEY = "primary key";
export const FOREIGN_KEY = "foreign key";

/* NOTE: This is a default formData value, 
required to fix the missing config for an existing mongo query */
export const MongoDefaultActionConfig = {
  actionConfiguration: {
    formData: {
      aggregate: {
        limit: {
          data: "10",
        },
        arrayPipelines: {
          data: "",
        },
      },
      delete: {
        limit: {
          data: "SINGLE",
        },
        query: {
          data: "",
        },
      },
      updateMany: {
        limit: {
          data: "SINGLE",
        },
        query: {
          data: "",
        },
        update: {
          data: "",
        },
      },
      smartSubstitution: {
        data: true,
      },
      collection: {
        data: "",
      },
      find: {
        skip: {
          data: "",
        },
        query: {
          data: "",
        },
        sort: {
          data: "",
        },
        limit: {
          data: "",
        },
        projection: {
          data: "",
        },
      },
      insert: {
        documents: {
          data: "",
        },
      },
      count: {
        query: {
          data: "",
        },
      },
      distinct: {
        query: {
          data: "",
        },
        key: {
          data: "",
        },
      },
    },
  },
};
