import styled from "styled-components";

const _defaultContainer = styled.div`
  display: flex;
  overflow-y: auto;
  padding: var(--ads-v2-spaces-7);
`;

export const PublishPageHeaderContainer = styled(_defaultContainer)`
  flex-direction: column;
  border-bottom: 1px solid var(--ads-v2-color-border);
  width: 100%;
`;
export const PublishPageFooterContainer = styled(_defaultContainer)`
  border-top: 1px solid var(--ads-v2-color-border);
  justify-content: space-between;
  align-items: center;
  padding: var(--ads-v2-spaces-5);
  position: sticky;
  bottom: 0;
  background: var(--ads-v2-color-white);
`;
export const PublishPageBodyContainer = styled(_defaultContainer)`
  height: 100%;
  gap: var(--ads-v2-spaces-7);
`;

export const PublishSuccessPageBodyContainer = styled(_defaultContainer)`
  height: 100%;
  gap: var(--ads-v2-spaces-7);
  display: flex;
  flex-direction: column;

  button {
    align-self: flex-end;
  }
`;
export const PublishPageTemplateDetailsInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const PublishPageAppSettingContainer = styled.div`
  margin-top: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

export const TemplatePreviewCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 24px solid var(--ads-v2-color-bg-muted);
  padding: var(--ads-v2-spaces-6);
  min-height: 360px;
  gap: 4px;
  height: fit-content;

  .strong {
    font-weight: 500;
  }

  .excerpt {
    color: var(--colors-ui-control-value);
  }
`;

export const TemplatePreviewImgPreviewContainer = styled.div`
  width: 320px;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const TemplatePreviewProfileContainer = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const TemplateInfoFormWrapper = styled.div`
  & > div {
    margin-bottom: 16px;
  }
`;
export const TemplateInfoFormFieldWrapper = styled.div`
  .user-profile-image-picker {
    margin-top: 4px;
  }
`;

export const TemplateInfoFormLabelWrapper = styled.div`
  .self-center {
    align-self: center;
  }
  color: var(--ads-v2-color-fg);
`;
