import React from "react";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  Hits,
  SearchBox,
  Highlight,
  Configure,
} from "react-instantsearch-dom";

import "instantsearch.css/themes/algolia.css";

import PropTypes from "prop-types";
import { Icon } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import {
  setHelpModalVisibility,
  setHelpDefaultRefinement,
} from "actions/helpActions";
import styled from "styled-components";
import { HelpIcons } from "icons/HelpIcons";
import { HelpBaseURL } from "constants/HelpConstants";
import { getDefaultRefinement } from "selectors/helpSelectors";
import { getAppsmithConfigs } from "configs";
const { algolia } = getAppsmithConfigs();
const searchClient = algoliasearch(algolia.apiId, algolia.apiKey);
console.log({ algolia });
const OenLinkIcon = HelpIcons.OPEN_LINK;
const DocumentIcon = HelpIcons.DOCUMENT;

const StyledOpenLinkIcon = styled(OenLinkIcon)`
  position: absolute;
  right: 14px;
  top: 1px;
  width: 12px;
  height: 12px;
  display: none;
  svg {
    width: 12px;
    height: 12px;
  }
`;

const StyledDocumentIcon = styled(DocumentIcon)`
  margin-left: 14px;
  margin-right: 10.8px;
  margin-top: 1px;
  position: absolute;
`;
function Hit(props: any) {
  return (
    <div
      className="t--docHit"
      onClick={() => {
        window.open(
          (props.hit.path as string).replace("master", HelpBaseURL),
          "_blank",
        );
      }}
    >
      <div className="hit-name t--docHitTitle">
        <StyledDocumentIcon
          width={11.2}
          height={14}
          color="#181F24"
        ></StyledDocumentIcon>
        <Highlight attribute="title" hit={props.hit} />
        <StyledOpenLinkIcon
          className="t--docOpenLink open-link"
          color={"#181F24"}
        ></StyledOpenLinkIcon>
      </div>
    </div>
  );
}

Hit.propTypes = {
  hit: PropTypes.object.isRequired,
};

const Header = styled.div`
  position: absolute;
  width: 100%;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
`;

const SearchContainer = styled.div`
  height: 100%;
  background: #181f24;

  .ais-SearchBox {
    position: relative;
    height: 30px;
    margin: 14px;
    margin-top: 0;
  }

  .ais-SearchBox-form {
    height: 100%;
  }

  [class^="ais-"] {
    font-size: inherit;
  }

  .ais-Hits {
    margin-top: 86px;
    height: calc(100% - 86px);
    overflow: auto;
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }
  .ais-SearchBox-input {
    height: 100%;
    padding: 4px 27px;
    padding-right: 14px;
    border-radius: 2px;
    border: 0;
    font-size: 14px;
  }

  .ais-SearchBox-submitIcon {
    width: 10.5px;
    height: 10.5px;
  }

  .ais-Pagination {
    margin-top: 1em;
  }

  .ais-Hits-list {
    margin: 0;
  }
  .ais-Hits-item {
    margin-bottom: 1em;
    width: 100%;
    margin: 0;
    padding: 5px;
    border: 0;
    cursor: pointer;
    box-shadow: none;
  }

  .ais-Hits-item:hover {
    background-color: #313740;
  }
  .ais-Hits-item:hover .open-link {
    display: block;
  }

  .hit-name {
    font-size: 14px;
    line-height: 16px;
    color: #e7e9e9;
    position: relative;
  }

  .ais-SearchBox-resetIcon {
    width: 10px;
    height: 10px;
  }

  .hit-description {
    color: #888;
    font-size: 14px;
    margin-bottom: 0.5em;
    font-style: normal;
    font-weight: normal;
    font-size: 12px;
    line-height: 20px;
    /*Making description two lines*/
    height: 42px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    -webkit-box-orient: vertical;
    /*Making description two lines*/
    /* or 167% */

    letter-spacing: 0.2px;
  }

  .ais-Highlight {
    margin-left: 36px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: calc(100% - 36px);
    display: inline-block;
  }

  .ais-Highlight-highlighted {
    background-color: #238770;
  }
  .ais-SearchBox-submit {
    left: 4px;
  }
`;

export default function DocumentationSearch(props: { hitsPerPage: number }) {
  const dispatch = useDispatch();
  const defaultRefinement = useSelector(getDefaultRefinement);
  console.log({ algolia });
  if (!algolia.enabled) return null;
  return (
    <SearchContainer className="ais-InstantSearch t--docSearchModal">
      <Icon
        className="t--docsMinimize"
        style={{
          position: "absolute",
          top: 4,
          right: 6,
          padding: 8,
          cursor: "pointer",
          zIndex: 1,
        }}
        icon="minus"
        color="white"
        iconSize={14}
        onClick={() => {
          dispatch(setHelpModalVisibility(false));
          dispatch(setHelpDefaultRefinement(""));
        }}
      ></Icon>
      <div
        style={{
          height: "100%",
          overflow: "auto",
        }}
      >
        <InstantSearch
          indexName={algolia.indexName}
          searchClient={searchClient}
        >
          <Configure hitsPerPage={props.hitsPerPage} />
          <Header>
            <h3
              style={{
                padding: "0 69px",
                marginTop: "14px",
                marginBottom: "14px",
                lineHeight: "14px",
              }}
            >
              <span
                style={{
                  textAlign: "center",
                  color: "white",
                  position: "relative",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "14px",
                  letterSpacing: "0.2px",
                  margin: "0 auto",
                  width: "121px",
                }}
              >
                Documentation
              </span>
            </h3>

            <SearchBox defaultRefinement={defaultRefinement} />
          </Header>

          <Hits hitComponent={Hit as any} />
        </InstantSearch>
      </div>
    </SearchContainer>
  );
}
