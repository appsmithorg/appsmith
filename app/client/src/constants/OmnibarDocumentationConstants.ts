import { includes, some } from "lodash";

const omnibarDocumentationHelper = (linkURL: string) => {
  const documentationHeaders = [
    {
      text: ["mongodb", "mongo-plugin"],
      query: "MongoDB",
    },
    {
      text: ["redis"],
      query: "redis",
    },
    {
      text: ["redshift"],
      query: "redshift",
    },
    {
      text: ["amazon-s3"],
      query: "Amazon S3",
    },
    {
      text: ["querying-firestore"],
      query: "Firestore",
    },
    {
      text: ["querying-mysql"],
      query: "Mysql",
    },
    {
      text: ["querying-mssql"],
      query: "Mssql",
    },
    {
      text: ["querying-elasticsearch"],
      query: "elasticsearch",
    },
    {
      text: ["querying-postgres", "postgres-plugin"],
      query: "postgres",
    },
    {
      text: ["querying-dynamodb"],
      query: "dynamodb",
    },
  ];
  const doc = documentationHeaders.find((headerItem) =>
    some(headerItem.text, (el) =>
      includes(linkURL.toLowerCase(), el.toLowerCase()),
    ),
  );
  if (doc) {
    return doc.query;
  } else {
    return "";
  }
};

export { omnibarDocumentationHelper };
