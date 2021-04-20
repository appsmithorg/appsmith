import { includes } from "lodash";

const omnibarDocumentationHelper = (linkURL: string) => {
  const documentationHeaders = [
    {
      text: "mongodb",
      query: "MongoDB",
    },
    {
      text: "redis",
      query: "redis",
    },
    {
      text: "redshift",
      query: "redshift",
    },
    {
      text: "amazon-s3",
      query: "Amazon S3",
    },
    {
      text: "querying-firestore",
      query: "Firestore",
    },
    {
      text: "querying-mysql",
      query: "Mysql",
    },
    {
      text: "querying-mssql",
      query: "Mssql",
    },
    {
      text: "querying-elasticsearch",
      query: "elasticsearch",
    },
    {
      text: "querying-postgres",
      query: "postgres",
    },
    {
      text: "querying-dynamodb",
      query: "dynamodb",
    },
  ];
  console.log("linkURL: ", linkURL);
  for (const headerItem of documentationHeaders) {
    if (includes(linkURL, headerItem.text)) {
      return {
        hasSpecificDocumentation: true,
        specificDocumentationText: headerItem.query,
      };
    }
  }
  return {
    hasSpecificDocumentation: false,
    specificDocumentationText: "",
  };
};

export { omnibarDocumentationHelper };
