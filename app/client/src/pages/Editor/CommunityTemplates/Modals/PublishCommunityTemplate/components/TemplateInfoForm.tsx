import React from "react";
import {
  TemplateInfoFormLabelWrapper,
  TemplateInfoFormFieldWrapper,
  TemplateInfoFormWrapper,
} from "../StyledComponents";
import { Input, Select, Option } from "design-system";
import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { useSelector } from "react-redux";
import { allTemplatesFiltersSelector } from "selectors/templatesSelectors";

interface Props {
  setTemplateDescription: (templateDescription: string) => void;
  setTemplateExcerpt: (excerpt: string) => void;
  setTemplateName: (templateName: string) => void;
  setTemplateUseCases: (useCases: string[]) => void;
  templateDescription: string;
  templateExcerpt: string;
  templateName: string;
  templateUseCases: string[];
}

const TemplateInfoForm = ({
  setTemplateDescription,
  setTemplateExcerpt,
  setTemplateName,
  setTemplateUseCases,
  templateDescription,
  templateExcerpt,
  templateName,
  templateUseCases,
}: Props) => {
  return (
    <TemplateInfoFormWrapper>
      <TemplateInfoFormFieldWrapper>
        <Input
          data-testid="t--community-template-name-input"
          errorMessage={
            templateName.length > 0
              ? ""
              : createMessage(
                  COMMUNITY_TEMPLATES.publishFormPage.templateForm
                    .titleRequiredError,
                )
          }
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
          data-testid="t--community-template-excerpt-input"
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
        <UseCasesSelect
          setTemplateUseCases={setTemplateUseCases}
          templateUseCases={templateUseCases}
        />
      </TemplateInfoFormFieldWrapper>
    </TemplateInfoFormWrapper>
  );
};

export default TemplateInfoForm;

interface UseCaseProps {
  setTemplateUseCases: (useCases: string[]) => void;
  templateUseCases: string[];
}
const UseCasesSelect = ({
  setTemplateUseCases,
  templateUseCases,
}: UseCaseProps) => {
  const filters = useSelector(allTemplatesFiltersSelector);
  const useCases = filters.useCases;
  return (
    <Select
      data-testid="t--community-template-usecases-input"
      isMultiSelect
      onChange={setTemplateUseCases}
      value={templateUseCases}
    >
      {useCases &&
        useCases.map((useCase, index) => (
          <Option key={`${useCase}-${index}`} label={useCase} value={useCase}>
            {useCase}
          </Option>
        ))}
    </Select>
  );
};
