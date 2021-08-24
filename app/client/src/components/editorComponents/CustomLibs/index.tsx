import Button from "components/ads/Button";
import Dropdown from "components/ads/Dropdown";
import { TabComponent } from "components/ads/Tabs";
import { debounce } from "lodash";
import React from "react";
import { useState } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import styled from "styled-components";

const LibraryContainer = styled.div`
  background: white;
  padding: 25px 30px;
  height: 535px;
  width: 750px;
  display: flex;
  flex-direction: column;
  .react-tabs__tab-panel {
    height: calc(100% - 80px);
  }
  input {
    position: absolute;
    border: 1.2px solid #e0dede;
    top: 60px;
    padding: 10px 12px;
    right: 45px;
    width: 220px;
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
  &:hover {
    border: 1px solid #cb4810;
  }
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
  > * {
    margin: 0 5px;
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
  return (
    <LibraryWrapper>
      <LibraryList>
        <LibraryCard>
          <LibraryInfo>
            <span>Lodash</span>
            <span>Lodash</span>
            <span>Lodash</span>
            <span>Lodash</span>
          </LibraryInfo>
          <LibraryActions>
            <Button text="Install" />
            <Button text="Uninstall" />
          </LibraryActions>
        </LibraryCard>
      </LibraryList>
    </LibraryWrapper>
  );
}

function AllLibraries({ libraries }: any) {
  const [versions, setVersions] = useState<any>({});
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
  return (
    <LibraryWrapper>
      <LibraryList>
        {(libraries || []).map((lib: any, idx: number) => (
          <LibraryCard key={idx} onMouseOver={(e) => fetchVersions(lib.name)}>
            <LibraryInfo>
              <span className="lib-name">{lib.name}</span>
              <span className="lib-desc">{lib.description}</span>
              <Dropdown
                className="lib-version"
                options={versions[lib.name] || []}
                selected={{ label: lib.version, value: lib.version }}
              />
            </LibraryInfo>
            <LibraryActions>
              <Button text="Install" />
              <Button text="Uninstall" />
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
