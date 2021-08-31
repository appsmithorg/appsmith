import { initializeInstallation } from "actions/cutomLibsActions";
import Button from "components/ads/Button";
import Dropdown from "components/ads/Dropdown";
import { TabComponent } from "components/ads/Tabs";
import { debounce } from "lodash";
import React from "react";
import { useState } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";

const LibraryContainer = styled.div`
  background: white;
  padding: 25px 30px;
  height: 630px;
  width: 750px;
  display: flex;
  flex-direction: column;
  .react-tabs__tab-panel {
    height: calc(100% - 80px);
  }
  input {
    position: absolute;
    border: 1.2px solid #e0dede;
    top: 58px;
    padding: 8px 12px;
    right: 45px;
    width: 240px;
    height: 35px;
    font-size: 12px;
  }
`;

const LibraryList = styled.div`
  background: white;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
`;

const LibraryCard = styled.div`
  display: flex;
  padding: 12px;
  justify-content: space-between;
  align-items: center;
  flex-grow: 1;
  border: 1px solid #f0f0f0;
  margin-bottom: 18px;
  cursor: pointer;
`;

const LibraryInfo = styled.div`
  display: flex;
  flex-direction: column;
  > * {
    margin: 3px 0;
  }
  .lib-name {
    font-size: 14px;
  }
  .lib-desc {
    font-size: 12px;
  }
  .lib-version {
    background: #f0f0f0;
    border: none;
    height: 32px;
    width: 150px;
    .cs-text {
      color: #090707;
    }
  }
`;

const LibraryActions = styled.div`
  display: flex;
  flex-shrink: 0;
  > * {
    margin: 0 5px;
  }
  .uninstall-btn {
    background: #f22b2b;
    color: white;
    border: 1.2px solid #f22b2b;
  }
  .update-btn {
    background: white;
    border: 1.2px solid #716e6e;
    color: #716e6e;
  }
`;

const LibraryHeader = styled.div`
  font-size: 20px;
  color: #090707;
  margin-bottom: 16px;
  font-weight: 500;
`;

const LibraryWrapper = styled.div`
  padding: 10px 15px 10px 0;
  margin-top: 2px;
  border-top: 1px solid #ebebeb;
`;

function InstalledLibraries() {
  const libraries = useSelector(
    (state: AppState) => state.ui.customLibs.defaultLibraries,
  );
  return (
    <LibraryWrapper>
      <LibraryList>
        {(libraries || []).map((lib: any, idx: number) => (
          <LibraryCard key={idx}>
            <LibraryInfo>
              <span className="lib-name">{lib.name}</span>
              <span className="lib-desc">{lib.description}</span>
              <span className="lib-desc">{lib.version}</span>
            </LibraryInfo>
            <LibraryActions>
              <Button className="update-btn" text="Update to latest" />
              <Button className="uninstall-btn" text="Uninstall" />
            </LibraryActions>
          </LibraryCard>
        ))}
      </LibraryList>
    </LibraryWrapper>
  );
}

function AllLibraries({ libraries }: any) {
  const [versions, setVersions] = useState<any>({}),
    dispatch = useDispatch();
  const currentInstallations = useSelector(
    (state: AppState) => state.ui.customLibs.currentInstallations,
  );
  const fetchVersions = (name: string) => {
    if (typeof versions[name] === "undefined")
      fetch(`https://api.cdnjs.com/libraries/${name}?fields=versions`)
        .then((res) => res.json())
        .then((res) =>
          setVersions({
            ...versions,
            [name]: res.versions.map((v: string) => ({ label: v, value: v })),
          }),
        );
  };
  const installLibrary = (lib: any) => {
    dispatch(initializeInstallation(lib));
  };
  return (
    <LibraryWrapper>
      <LibraryList>
        {(libraries || []).map((lib: any, idx: number) => (
          <LibraryCard key={idx}>
            <LibraryInfo onMouseOver={() => fetchVersions(lib.name)}>
              <span className="lib-name">{lib.name}</span>
              <span className="lib-desc">{lib.description}</span>
              <Dropdown
                className="lib-version"
                enableSearch
                options={versions[lib.name] || []}
                selected={{ label: lib.version, value: lib.version }}
                showLabelOnly
              />
            </LibraryInfo>
            <LibraryActions>
              {currentInstallations.indexOf(lib.name) === -1 ? (
                <Button
                  className="install-btn"
                  onClick={() => installLibrary(lib)}
                  text="Install"
                />
              ) : (
                "Installing"
              )}
            </LibraryActions>
          </LibraryCard>
        ))}
      </LibraryList>
    </LibraryWrapper>
  );
}

function CustomLibrary() {
  const [libraries, setLibraries] = useState([]);
  const [query, setQuery] = useState("");
  const handleLibSearch = useCallback((e: React.ChangeEvent) => {
    const currentQuery = (e.target as HTMLInputElement).value;
    setQuery(currentQuery);
    searchLibrary(currentQuery);
  }, []);

  useEffect(() => searchLibrary(query), []);

  const searchLibrary = useCallback(
    debounce((query) => {
      fetch(
        `https://api.cdnjs.com/libraries?fields=filename,description,version&limit=10${
          query ? `&search=${query}` : ""
        }`,
      )
        .then((res) => res.json())
        .then((res) => setLibraries(res.results));
    }, 300),
    [],
  );

  return (
    <LibraryContainer>
      <LibraryHeader>JS Libraries</LibraryHeader>
      <input onChange={handleLibSearch} placeholder="Search" value={query} />
      <TabComponent
        tabs={[
          {
            key: "installed",
            title: "Installed",
            panelComponent: <InstalledLibraries />,
          },
          {
            key: "all",
            title: "All",
            panelComponent: <AllLibraries libraries={libraries} />,
          },
        ]}
      />
    </LibraryContainer>
  );
}

export default CustomLibrary;
