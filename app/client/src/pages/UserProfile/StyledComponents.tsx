import styled from "styled-components";

export const Wrapper = styled.div`
  width: 320px;
  /* margin: 0 auto; */
  & > div {
    margin-bottom: 16px;
  }
`;
export const FieldWrapper = styled.div`
  /* width: 460px; */
  /* display: flex; */
  .user-profile-image-picker {
    width: 166px;
    margin-top: 4px;
  }
`;

export const LabelWrapper = styled.div`
  .self-center {
    align-self: center;
  }
  /* width: 240px; */
  /* display: flex; */
  color: var(--ads-v2-color-fg);
  /* font-size: 14px; */
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
