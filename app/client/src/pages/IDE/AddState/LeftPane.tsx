import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { setIdeSidebarWidth } from "../ideActions";

const Container = styled.div`
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  p {
    font-size: 30px;
    color: #4c5664;
  }
`;

const AddLeftPane = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setIdeSidebarWidth(300));
  }, []);
  return (
    <Container>
      <p>Add</p>
    </Container>
  );
};

export default AddLeftPane;
