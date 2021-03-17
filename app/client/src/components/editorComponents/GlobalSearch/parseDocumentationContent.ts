import marked from "marked";
import { HelpBaseURL } from "constants/HelpConstants";
import { algoliaHighlightTag } from "./utils";

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
export const htmlToElement = (html: string) => {
  const template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
};

/**
 * strip:
 * gitbook plugin tags
 */
const strip = (text: string) => text.replace(/{% .*?%}/gm, "");

/**
 * strip: description tag from the top
 */
const stripMarkdown = (text: string) =>
  text.replace(/---\n[description]([\S\s]*?)---/gm, "");

const getDocumentationCTA = (path: any) => {
  const href = path.replace("master", HelpBaseURL);
  const htmlString = `<a class="documentation-cta" href="${href}" target="_blank">Open Documentation</a>`;
  return htmlToElement(htmlString);
};

/**
 * Replace all H1s with H2s
 * Check first child of body
 *   if exact match as title -> replace with h1
 *   else prepend h1
 * Append open documentation button to title
 */
const updateDocumentDescriptionTitle = (documentObj: any, item: any) => {
  const { rawTitle, path } = item;

  Array.from(documentObj.querySelectorAll("h1")).forEach((match: any) => {
    match.outerHTML = `<h2>${match.innerHTML}</h2>`;
  });

  let firstChild = documentObj.querySelector("body")
    ?.firstChild as HTMLElement | null;

  const matchesExactly = rawTitle === firstChild?.innerHTML;

  // additional space for word-break
  if (matchesExactly && firstChild) {
    firstChild.outerHTML = `<h1>${firstChild?.innerHTML} </h1>`;
  } else {
    const h = document.createElement("h1");
    h.innerHTML = `${rawTitle} `;
    firstChild?.parentNode?.insertBefore(h, firstChild);
  }

  firstChild = documentObj.querySelector("body")
    ?.firstChild as HTMLElement | null;

  if (firstChild) {
    // append documentation button after title:
    const ctaElement = getDocumentationCTA(path) as Node;
    firstChild.appendChild(ctaElement);
  }
};

const replaceHintTagsWithCode = (text: string) => {
  let result = text.replace(/{% hint .*?%}/, "```");
  result = result.replace(/{% endhint .*?%}/, "```");
  result = marked(result);
  return result;
};

const parseDocumentationContent = (item: any): string | undefined => {
  try {
    const { rawDocument } = item;
    let value = rawDocument;
    if (!value) return;

    value = stripMarkdown(value);
    value = replaceHintTagsWithCode(value);

    const parsedDocument = marked(value);

    const domparser = new DOMParser();
    const documentObj = domparser.parseFromString(parsedDocument, "text/html");

    // remove algolia highlight within code sections
    const aisTag = new RegExp(
      `&lt;${algoliaHighlightTag}&gt;|&lt;/${algoliaHighlightTag}&gt;`,
      "g",
    );
    Array.from(documentObj.querySelectorAll("code")).forEach((match) => {
      match.innerHTML = match.innerHTML.replace(aisTag, "");
    });

    // update link hrefs and target
    const aisTagEncoded = new RegExp(
      `%3C${algoliaHighlightTag}%3E|%3C/${algoliaHighlightTag}%3E`,
      "g",
    );

    Array.from(documentObj.querySelectorAll("a")).forEach((match) => {
      match.target = "_blank";
      try {
        const hrefURL = new URL(match.href);
        const isRelativeURL = hrefURL.hostname === window.location.hostname;
        match.href = !isRelativeURL
          ? match.href
          : `${HelpBaseURL}/${match.getAttribute("href")}`;
        match.href = match.href.replace(aisTagEncoded, "");
      } catch (e) {}
    });

    // update description title
    updateDocumentDescriptionTitle(documentObj, item);

    const content = strip(documentObj.body.innerHTML).trim();
    return content;
  } catch (e) {
    console.log(e, "err");
    return;
  }
};

export default parseDocumentationContent;
