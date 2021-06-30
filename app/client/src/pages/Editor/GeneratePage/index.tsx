import { getTypographyByKey } from "constants/DefaultTheme";
import React, { useEffect } from "react";
import styled from "styled-components";
import PageContent from "./components/PageContent";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "../../../selectors/editorSelectors";
import { updateCurrentPage } from "../../../actions/pageActions";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const HeadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
`;

const Heading = styled.h1`
  font-size: 40px;
  font-style: normal;
  font-weight: 500;
  line-height: 48px;
  letter-spacing: 0px;
  text-align: center;
  margin: 0;
`;

const SubHeading = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  margin: 10px;
`;

function GeneratePage() {
  const params = useParams<{ applicationId: string; pageId: string }>();
  const dispatch = useDispatch();

  const currentPageId = useSelector(getCurrentPageId);

  // Switch page
  useEffect(() => {
    if (currentPageId !== params.pageId && !!params.pageId) {
      dispatch(updateCurrentPage(params.pageId));
    }
  }, [currentPageId, params.pageId, dispatch]);

  return (
    <Container>
      <HeadingContainer>
        <Heading> 🚀 Quick page generation</Heading>
      </HeadingContainer>
      <SubHeading>
        Select data, table and columns and generate the page.
      </SubHeading>
      <PageContent />
    </Container>
  );
}

export default GeneratePage;
