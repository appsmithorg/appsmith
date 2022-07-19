import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import WidgetCard from "./WidgetCard";
import { getWidgetCards } from "selectors/editorSelectors";
import ExplorerSearch from "./Explorer/ExplorerSearch";
import { debounce, isNaN } from "lodash";
import {
  createMessage,
  WIDGET_SIDEBAR_CAPTION,
} from "@appsmith/constants/messages";
import Fuse from "fuse.js";
import { WidgetCardProps } from "widgets/BaseWidget";

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;

  margin: 8px;

  button {
    padding: 8px 16px;
    margin-top: 16px;
    background-color: lightgreen;
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  margin: 6px 0;

  label {
    flex-grow: 1;
  }
  input {
    border-bottom: 1px solid black;
  }
`;

function WidgetSidebar({ isActive }: { isActive: boolean }) {
  const [data, setData] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("fuse") || "");
    } catch (e) {
      console.error(e);
      return null;
    }
  });
  const [location, setLocation] = useState<number>(data?.location || 0);
  const [threshold, setThreshold] = useState<number>(data?.threshold || 0.5);
  const [distance, setDistance] = useState<number>(data?.distance || 20);
  const [displayNameWeight, setDisplayNameWeight] = useState<number>(
    data?.displayNameWeight || 0.7,
  );
  const [tagsWeight, setTagsWeight] = useState<number>(data?.tagsWeight || 0.3);
  const cards = useSelector(getWidgetCards);
  const [filteredCards, setFilteredCards] = useState(cards);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  let fuse: Fuse<WidgetCardProps, Fuse.FuseOptions<WidgetCardProps>>;

  // useEffect(() => {}, []);

  useEffect(() => {
    console.log("$$$$$$$");
    console.log(data);
    fuse = new Fuse(cards, {
      keys: [
        {
          name: "displayName",
          weight: data?.displayNameWeight
            ? data?.displayNameWeight
            : displayNameWeight,
        },
        {
          name: "searchTags",
          weight: data?.tagsWeight ? data?.tagsWeight : tagsWeight,
        },
      ],
      // keys: ["displayName", "searchTags"],
      threshold: data?.threshold ? data?.threshold : threshold,
      distance: data?.distance ? data?.distance : distance,
      location: data?.location ? data?.location : location,
    });
  }, [
    cards,
    location,
    distance,
    threshold,
    displayNameWeight,
    tagsWeight,
    data,
  ]);

  const filterCards = (keyword: string) => {
    if (keyword.trim().length > 0) {
      const searchResult = fuse.search(keyword);
      setFilteredCards(searchResult as WidgetCardProps[]);
    } else {
      setFilteredCards(cards);
    }
  };

  useEffect(() => {
    if (isActive) searchInputRef.current?.focus();
  }, [isActive]);

  /**
   * filter widgets
   */
  const search = debounce((e: any) => {
    filterCards(e.target.value.toLowerCase());
  }, 300);

  /**
   * clear the search input
   */
  const clearSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    filterCards("");
    searchInputRef.current?.focus();
  };

  const handleChange = (e: any, fn: any) => {
    fn(e.target?.value);
    updateData();
  };

  const handleClick = () => {
    const json = {
      location,
      distance,
      threshold,
      displayNameWeight,
      tagsWeight,
    };
    setData(json);
    localStorage.setItem("fuse", JSON.stringify(json));
  };

  const updateData = () => {
    setData({
      location,
      distance,
      threshold,
      displayNameWeight,
      tagsWeight,
    });
  };

  return (
    <div
      className={`flex flex-col overflow-hidden ${isActive ? "" : "hidden"}`}
    >
      <ExplorerSearch
        autoFocus
        clear={clearSearchInput}
        onChange={search}
        placeholder="Search widgets..."
        ref={searchInputRef}
      />
      <OptionsContainer>
        <InputContainer>
          <label htmlFor="location">Location</label>
          <input
            name="location"
            onChange={(e) => handleChange(e, setLocation)}
            type="text"
            value={location}
          />
        </InputContainer>
        <InputContainer>
          <label htmlFor="threshold">Threshold</label>
          <input
            name="threshold"
            onChange={(e) => handleChange(e, setThreshold)}
            type="text"
            value={threshold}
          />
        </InputContainer>
        <InputContainer>
          <label htmlFor="location">Distance</label>
          <input
            name="distance"
            onChange={(e) => handleChange(e, setDistance)}
            type="text"
            value={distance}
          />
        </InputContainer>
        <InputContainer>
          <label htmlFor="wgt-name">Name Weight</label>
          <input
            name="wgt-name"
            onChange={(e) => handleChange(e, setDisplayNameWeight)}
            type="text"
            value={displayNameWeight}
          />
        </InputContainer>
        <InputContainer>
          <label htmlFor="wgt-tags">Tags Weight</label>
          <input
            name="wgt-tags"
            onChange={(e) => handleChange(e, setTagsWeight)}
            type="text"
            value={tagsWeight}
          />
        </InputContainer>
        <button onClick={() => handleClick()}>Update</button>
      </OptionsContainer>
      <div className="flex-grow px-3 overflow-y-scroll">
        <p className="px-3 py-3 text-sm leading-relaxed text-trueGray-400 t--widget-sidebar">
          {createMessage(WIDGET_SIDEBAR_CAPTION)}
        </p>
        <div className="grid items-stretch grid-cols-3 gap-3 justify-items-stretch">
          {filteredCards.map((card) => (
            <WidgetCard details={card} key={card.key} />
          ))}
        </div>
      </div>
    </div>
  );
}

WidgetSidebar.displayName = "WidgetSidebar";

export default WidgetSidebar;
