export * from "ce/pages/Editor/Explorer/helpers";

import { matchBuilderPath, matchViewerPath } from "constants/routes";

export const hasNavigatedOutOfPage = (
  previousUrl: string,
  currentUrl: string,
) => {
  const matchBuilderPath_Previous = matchBuilderPath(previousUrl, {
    end: false, // to match with entity paths (e.g. jsobject path)
  });
  const matchBuilderPath_Current = matchBuilderPath(currentUrl, {
    end: false,
  });
  const matchViewerPath_Previous = matchViewerPath(previousUrl);
  const matchViewerPath_Current = matchViewerPath(currentUrl);

  if (matchBuilderPath_Previous)
    return matchBuilderPath_Current
      ? matchBuilderPath_Previous.params.pageId !==
          matchBuilderPath_Current.params.pageId
      : true;
  else if (matchViewerPath_Previous)
    return matchViewerPath_Current
      ? matchViewerPath_Previous.params.pageId !==
          matchViewerPath_Current.params.pageId
      : true;
  return false;
};
