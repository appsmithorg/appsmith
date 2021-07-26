/**
 * When routing from "/generate-page/form" ?initiator=generate-page is added to queryParam
 * to keep track and write logic accordingly.
 * getIsGeneratePageInitiator just checks is the initiator key value inside queryParam is "generate-page" or not.
 *
 * @param {string} [initiator]
 * @return {*}  {boolean}
 */

export const getIsGeneratePageInitiator = (initiator?: string): boolean => {
  if (initiator) {
    const isGeneratePageInitiator = initiator === "generate-page";
    return isGeneratePageInitiator;
  }
  const params: string = location.search;
  const searchParamsInstance = new URLSearchParams(params);
  const initiatorParam = searchParamsInstance.get("initiator");
  const isGeneratePageInitiator = initiatorParam === "generate-page";
  return isGeneratePageInitiator;
};
