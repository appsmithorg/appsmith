import React from "react";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  Hits,
  SearchBox,
  Highlight,
  Configure,
  PoweredBy,
} from "react-instantsearch-dom";
import "instantsearch.css/themes/algolia.css";
import { connect } from "react-redux";
import styled from "styled-components";
import { HelpIcons } from "icons/HelpIcons";
import { HelpBaseURL } from "constants/HelpConstants";
import { getDefaultRefinement } from "selectors/helpSelectors";
import { getAppsmithConfigs } from "configs";
import { AppState } from "reducers";

const { algolia } = getAppsmithConfigs();
const searchClient = algoliasearch(algolia.apiId, algolia.apiKey);

const OenLinkIcon = HelpIcons.OPEN_LINK;
const DocumentIcon = HelpIcons.DOCUMENT;
const GithubIcon = HelpIcons.GITHUB;
const ChatIcon = HelpIcons.CHAT;
const DiscordIcon = HelpIcons.DISCORD;

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

const StyledGithubIcon = styled(GithubIcon)`
  margin-left: 14px;
  margin-right: 10.8px;
  margin-top: 1px;
  position: absolute;
`;

const StyledChatIcon = styled(ChatIcon)`
  &&& {
    margin-left: 14px;
    margin-right: 10.8px;
    margin-top: 1px;
    position: absolute;
  }
`;

const StyledDiscordIcon = styled(DiscordIcon)`
  &&& {
    margin-left: 12px;
    margin-right: 10.8px;
    margin-top: 1px;
    position: absolute;
  }
`;

const Hit = (props: { hit: { path: string } }) => {
  return (
    <div
      className="t--docHit"
      onClick={() => {
        window.open(props.hit.path.replace("master", HelpBaseURL), "_blank");
      }}
    >
      <div className="hit-name t--docHitTitle">
        <StyledDocumentIcon width={11.2} height={14} color="#181F24" />
        <Highlight attribute="title" hit={props.hit} />
        <StyledOpenLinkIcon
          className="t--docOpenLink open-link"
          color={"#181F24"}
        />
      </div>
    </div>
  );
};

const HelpMenuItem = (props: {
  item: { label: string; link: string; icon: React.ReactNode };
}) => {
  return (
    <li className="ais-Hits-item">
      <div
        className="t--docHit"
        onClick={() => {
          window.open(props.item.link, "_blank");
        }}
      >
        <div className="hit-name t--docHitTitle">
          {props.item.icon}
          <span className="ais-Highlight">{props.item.label}</span>
          <StyledOpenLinkIcon
            className="t--docOpenLink open-link"
            color={"#181F24"}
          />
        </div>
      </div>
    </li>
  );
};

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
    background-color: #fff;
    border-radius: 2px;
  }

  [class^="ais-"] {
    font-size: inherit;
  }

  .ais-Hits {
    overflow: auto;
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }
  .ais-SearchBox-input {
    height: 100%;
    width: 188px;
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

  .ais-SearchBox-reset {
    right: 51px;
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

const Header = styled.div`
  padding: 10px 0;
  position: absolute;
  width: 100%;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
  height: 50px;
`;

const StyledPoweredBy = styled(PoweredBy)`
  position: absolute;
  right: 21px;
  top: 19px;
  z-index: 1;

  .ais-PoweredBy-text {
    display: none;
  }
`;

const HelpContainer = styled.div`
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const HelpFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 5px 10px;
  height: 30px;
  color: rgba(255, 255, 255, 0.7);
`;

const HelpBody = styled.div`
  padding-top: 50px;
  flex: 5;
`;

type Props = { hitsPerPage: number; defaultRefinement: string };
type State = { showResults: boolean };

const HELP_MENU_ITEMS = [
  {
    icon: <StyledDocumentIcon width={11.2} height={14} color="#181F24" />,
    label: "Documentation",
    link: "https://docs.appsmith.com/",
  },
  {
    icon: <StyledGithubIcon width={11.2} height={14} color="#fff" />,
    label: "Github Issues",
    link: "https://github.com/appsmithorg/appsmith/issues",
  },
  {
    icon: <StyledChatIcon width={11.2} height={14} color="#fff" />,
    label: "Chat with us",
    link: "https://github.com/appsmithorg/appsmith/discussions",
  },
  {
    icon: <StyledDiscordIcon width={16} height={16} />,
    label: "Join our Discord",
    link: "https://discord.gg/rBTTVJp",
  },
];

class DocumentationSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showResults: props.defaultRefinement.length > 0,
    };
  }
  onSearchValueChange = () => {
    if (!this.state.showResults) {
      this.setState({
        showResults: true,
      });
    }
  };
  render() {
    if (!algolia.enabled) return null;
    return (
      <SearchContainer className="ais-InstantSearch t--docSearchModal">
        <InstantSearch
          indexName={algolia.indexName}
          searchClient={searchClient}
        >
          <Configure hitsPerPage={this.props.hitsPerPage} />
          <HelpContainer>
            <Header>
              <StyledPoweredBy />
              <SearchBox
                onChange={this.onSearchValueChange}
                defaultRefinement={this.props.defaultRefinement}
              />
            </Header>
            <HelpBody>
              {this.state.showResults ? (
                <Hits hitComponent={Hit as any} />
              ) : (
                <ul className="ais-Hits-list">
                  {HELP_MENU_ITEMS.map(item => (
                    <HelpMenuItem key={item.label} item={item} />
                  ))}
                </ul>
              )}
            </HelpBody>
            <HelpFooter>
              <span>Appsmith v1.1</span>
              <span>Released 8 hours ago</span>
            </HelpFooter>
          </HelpContainer>
        </InstantSearch>
      </SearchContainer>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  defaultRefinement: getDefaultRefinement(state),
});

export default connect(mapStateToProps)(DocumentationSearch);
