import React from "react";
import {
  TemplateInfoFormLabelWrapper,
  TemplateInfoFormFieldWrapper,
  TemplateInfoFormWrapper,
} from "../styledComponents";
import { Input, Select, Option } from "design-system";
import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";

type Props = {
  setTemplateDescription: (templateDescription: string) => void;
  setTemplateExcerpt: (excerpt: string) => void;
  setTemplateName: (templateName: string) => void;
  templateDescription: string;
  templateExcerpt: string;
  templateName: string;
  // useCases: string[];
};

const TemplateInfoForm = ({
  setTemplateDescription,
  setTemplateExcerpt,
  setTemplateName,
  templateDescription,
  templateExcerpt,
  templateName,
}: Props) => {
  const useCases: string[] = ["Operations", "DevOps", "HR", "Finance"];
  return (
    <TemplateInfoFormWrapper>
      <TemplateInfoFormFieldWrapper>
        <Input
          isRequired
          label={createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.templateForm.titleInputLabel,
          )}
          labelPosition="top"
          onChange={setTemplateName}
          placeholder={createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.templateForm
              .titleInputPlaceholder,
          )}
          renderAs="input"
          size="md"
          type="text"
          value={templateName}
        />
      </TemplateInfoFormFieldWrapper>
      <TemplateInfoFormFieldWrapper>
        <Input
          label={createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.templateForm.excerptInputLabel,
          )}
          labelPosition="top"
          onChange={setTemplateExcerpt}
          placeholder={createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.templateForm
              .excerptInputPlaceholder,
          )}
          renderAs="input"
          size="md"
          type="text"
          value={templateExcerpt}
        />
      </TemplateInfoFormFieldWrapper>
      <TemplateInfoFormFieldWrapper>
        <Input
          label={createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.templateForm
              .descriptionInputLabel,
          )}
          labelPosition="top"
          onChange={setTemplateDescription}
          placeholder={createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.templateForm
              .descriptionInputPlaceholder,
          )}
          renderAs="textarea"
          size="md"
          type="text"
          value={templateDescription}
        />
      </TemplateInfoFormFieldWrapper>
      <TemplateInfoFormFieldWrapper>
        <TemplateInfoFormLabelWrapper>
          {createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.templateForm.useCasesInputLabel,
          )}
        </TemplateInfoFormLabelWrapper>
        <Select isMultiSelect>
          {useCases.map((useCase, index) => (
            <Option key={`${useCase}-${index}`} label={useCase} value={useCase}>
              {useCase}
            </Option>
          ))}
        </Select>
      </TemplateInfoFormFieldWrapper>
    </TemplateInfoFormWrapper>
  );
};

export default TemplateInfoForm;
