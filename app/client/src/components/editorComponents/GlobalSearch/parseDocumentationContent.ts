import marked from "marked";
import { HelpBaseURL } from "constants/HelpConstants";
import { algoliaHighlightTag } from "./utils";
import log from "loglevel";

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

export const YT_EMBEDDING_SELECTION_REGEX = [
  /{% embed url="<a href="https:\/\/www.youtube.com\/watch\?v=(.*?)\&.*? %}/m,
  /{% embed url="<a href="https:\/\/youtu.be.*?>https:\/\/youtu.be\/(.*?)".*? %}/m,
];

const getYtIframe = (videoId: string) => {
  return `<iframe width="100%" height="280" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
};
const updateYoutubeEmbeddingsWithIframe = (text: string) => {
  let docString = text;
  let match;
  YT_EMBEDDING_SELECTION_REGEX.forEach((ytRegex) => {
    while ((match = ytRegex.exec(docString)) !== null) {
      // gitbook adds \\ in front of a _ char in an id. TO remove that we have to do this.
      let videoId = match[1].replaceAll("%5C", "");
      videoId = videoId.replaceAll("\\", "");
      docString = docString.replace(ytRegex, getYtIframe(videoId));
    }
  });
  return docString;
};

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
  const { path, rawTitle } = item;

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

// Remove highlights if they don't match well
const removeBadHighlights = (node: HTMLElement | Document, query: string) => {
  Array.from(
    node.querySelectorAll(algoliaHighlightTag) as NodeListOf<HTMLElement>,
  ).forEach((match) => {
    // If the length of the highlighted node is less than the 1/2 length of
    // the query we remove the highlighted tag.
    // E.g query: "store any" won't highlight "any" nodes
    if (
      match.textContent &&
      match.textContent.length < Math.floor(query.length / 2)
    ) {
      const innerHtml = match.innerHTML;
      match.replaceWith(innerHtml);
    }
  });
};

const replaceHintTagsWithCode = (text: string) => {
  let result = text.replace(/{% hint .*?%}/, "```");
  result = result.replace(/{% endhint .*?%}/, "```");
  result = marked(result);
  return result;
};

const parseDocumentationContent = (item: any): string | undefined => {
  try {
    const { query, rawDocument } = item;
    let value = rawDocument;
    if (!value) return;

    const aisTag = new RegExp(
      `&lt;${algoliaHighlightTag}&gt;|&lt;/${algoliaHighlightTag}&gt;`,
      "g",
    );
    value = stripMarkdown(value);
    value = replaceHintTagsWithCode(value);

    const parsedDocument = marked(value);

    const domparser = new DOMParser();
    const documentObj = domparser.parseFromString(parsedDocument, "text/html");

    // remove algolia highlight within code sections

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

    // Combine adjacent highlighted nodes into a single one
    let adjacentMatches: string[] = [];
    const letterRegex = /[a-zA-Z]/g;
    // Get highlighted tags
    Array.from(documentObj.querySelectorAll(algoliaHighlightTag)).forEach(
      (match) => {
        // If adjacent element is an `algoliaHighlightTag` and the next
        // text content does not include a letter
        if (
          match.nextSibling?.textContent &&
          !letterRegex.test(match.nextSibling?.textContent) &&
          match.nextElementSibling?.nodeName.toLowerCase() ===
            algoliaHighlightTag &&
          !adjacentMatches.length &&
          match.textContent
        ) {
          // Store the matched word and the text content
          adjacentMatches = adjacentMatches.concat([
            match.textContent,
            match.nextSibling?.textContent,
          ]);
          // Remove the text node as we have stored this above
          match.nextSibling.remove();
          // Remove the node as we have it's text content
          match.remove();
        }
        // If this is part of a group of highligted words
        else if (adjacentMatches.length && match.textContent) {
          // store it's text content
          adjacentMatches.push(match.textContent);

          // If there are more adjacent highlight nodes ahead
          if (
            match.nextElementSibling?.nodeName.toLowerCase() ===
              algoliaHighlightTag &&
            match.nextSibling?.textContent &&
            !letterRegex.test(match.nextSibling?.textContent)
          ) {
            // store the text content
            adjacentMatches.push(match.nextSibling?.textContent);
            match.nextSibling.remove();
            // delete the node
            match.remove();
          }
          // We are at the last node of the group
          else {
            // Create a algoliaHighlightTag element and add the
            // grouped text
            const highlightTag = document.createElement(algoliaHighlightTag);
            highlightTag.innerText = adjacentMatches.join("");

            // Simply replace(or remove) the last node with the
            // newly created algoliaHighlightTag
            match.replaceWith(highlightTag);
            // Reset
            adjacentMatches = [];
          }
        } else {
          // Reset adjacentMatches. We are no longer part of a group of adjacent nodes.
          // Start afresh
          adjacentMatches = [];
        }
      },
    );

    // Remove highlight for nodes that don't match well
    removeBadHighlights(documentObj, query);
    let content = updateYoutubeEmbeddingsWithIframe(documentObj.body.innerHTML);
    content = strip(content).trim();
    return content;
  } catch (e) {
    log.error(e);
    return;
  }
};

export default parseDocumentationContent;
