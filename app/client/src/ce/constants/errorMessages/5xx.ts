import type { PageErrorMessageProps } from "pages/common/ErrorPages/Components/PageErrorMessage";

export const PAGE_SERVER_UNAVAILABLE_ERROR_CODE = () => "503";

// cloudHosting used in EE
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const PAGE_SERVER_UNAVAILABLE_TITLE = (cloudHosting: boolean) =>
  "Appsmith server unavailable";

export const PAGE_SERVER_UNAVAILABLE_DESCRIPTION = () =>
  "Please try again later";

export const PAGE_SERVER_UNAVAILABLE_ERROR_MESSAGES = (
  cloudHosting: boolean,
): PageErrorMessageProps[] => {
  if (cloudHosting) {
    return [
      {
        text: "If the problem persists, please contact customer support",
        links: [
          {
            from: 40,
            to: 56,
            href: "mailto: support@appsmith.com?subject=Appsmith 503 Server Error",
          },
        ],
        addNewLine: true,
      },
    ];
  } else {
    return [
      {
        text: "If the problem persists, please contact your admin",
        addNewLine: true,
      },
      {
        text: "You can find more information on how to debug and access the logs here",
        links: [
          {
            from: 66,
            to: 70,
            href: "https://docs.appsmith.com/learning-and-resources/how-to-guides/how-to-get-container-logs",
          },
        ],
        addNewLine: true,
      },
      {
        text: "A quick view of the server logs is accessible here",
        links: [
          {
            from: 46,
            to: 50,
            href: "/supervisor/logtail/backend",
          },
        ],
      },
    ];
  }
};
