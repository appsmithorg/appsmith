import React from "react";
import styled from "styled-components";
const FeatureInfoWrapper = styled.div`
  height: 320px;
  padding: 0px 15px 0px 15px;
  a {
    color: #f86a2b;
    text-decoration: underline;
  }
  .header-wrapper {
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
    letter-spacing: -0.23999999463558197px;
  }
  .description-wrapper {
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 19px;
    letter-spacing: -0.23999999463558197px;
  }
`;
function FeatureInfo({
  descInHTML,
  headingInHTML,
}: {
  headingInHTML: string;
  descInHTML: string;
}) {
  return (
    <FeatureInfoWrapper>
      <div className="header-wrapper"> {`${headingInHTML}`}</div>
      <div
        className="description-wrapper"
        dangerouslySetInnerHTML={{ __html: descInHTML }}
      />
    </FeatureInfoWrapper>
  );
}

export default FeatureInfo;
