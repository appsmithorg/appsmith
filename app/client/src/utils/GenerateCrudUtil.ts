/**
 * When routing from "/generate-page/form" ?isGeneratePageMode=generate-page is added to queryParam
 * to keep track and write logic accordingly.
 * getIsGeneratePageInitiator just checks is the isGeneratePageMode key value inside queryParam is "generate-page" or not.
 *
 * @param {string} [isGeneratePageMode]
 * @return {*}  {boolean}
 */

export const getIsGeneratePageInitiator = (
  isGeneratePageMode?: string,
): boolean => {
  if (isGeneratePageMode) {
    const isGeneratePageInitiator = isGeneratePageMode === "generate-page";
    return isGeneratePageInitiator;
  }
  const params: string = location.search;
  const searchParamsInstance = new URLSearchParams(params);
  const initiatorParam = searchParamsInstance.get("isGeneratePageMode");
  const isGeneratePageInitiator = initiatorParam === "generate-page";
  return isGeneratePageInitiator;
};
