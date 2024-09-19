import styled from "styled-components";
import React, { useRef, useEffect } from "react";

type Places = google.maps.places.PlaceResult[] | undefined;

interface SearchBoxProps {
  isEnabled: boolean;
  map?: google.maps.Map;
  placeholder?: string;
  updateCenter: (lat: number, long: number) => void;
}

const StyledInput = styled.input`
  position: absolute;
  top: 0%;
  box-sizing: border-box;
  border: 1px solid transparent;
  width: min(90%, 240px);
  height: 32px;
  padding: 0 12px;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  outline: none;
  text-overflow: ellipses;
  left: 0;
  right: 0;
  margin: 24px auto;
`;

const SearchBox = (props: SearchBoxProps) => {
  const { isEnabled, updateCenter } = props;
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const searchBoxObjRef = useRef<google.maps.places.SearchBox>();

  // initialize search box
  useEffect(() => {
    if (!searchBoxRef.current) return;

    searchBoxObjRef.current = new window.google.maps.places.SearchBox(
      searchBoxRef.current,
    );
  }, [searchBoxRef]);

  // add event listeners to search box
  useEffect(() => {
    if (!searchBoxObjRef.current) return;

    searchBoxObjRef.current?.addListener("places_changed", () => {
      const places: Places = searchBoxObjRef.current?.getPlaces();
      const location = places ? places[0].geometry?.location : undefined;

      if (location) {
        const lat = location.lat();
        const long = location.lng();

        updateCenter(lat, long);
      }
    });
  }, [updateCenter]);

  if (!isEnabled) return null;

  return (
    <StyledInput
      placeholder="Enter location to search"
      ref={searchBoxRef}
      type="text"
    />
  );
};

export default SearchBox;
