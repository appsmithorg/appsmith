import styled from "styled-components";

export const Wrapper = styled.div`
  & > div {
    margin-top: 27px;
  }
`;
export const FieldWrapper = styled.div`
  width: 460px;
  display: flex;
`;

export const LabelWrapper = styled.div`
  .self-center {
    align-self: center;
  }
  width: 200px;
  display: flex;
`;

export const Loader = styled.div`
  height: 38px;
  width: 320px;
  border-radius: 0;
`;

export const TextLoader = styled.div`
  height: 15px;
  width: 320px;
  border-radius: 0;
`;
