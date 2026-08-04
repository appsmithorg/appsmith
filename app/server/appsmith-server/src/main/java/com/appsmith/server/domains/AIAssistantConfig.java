package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.apache.commons.lang3.ObjectUtils;

import java.io.Serializable;

@Data
public class AIAssistantConfig implements Serializable {

    @JsonView(Views.Internal.class)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Encrypted private String claudeApiKey;

    @JsonView(Views.Internal.class)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Encrypted private String openaiApiKey;

    @JsonView(Views.Internal.class)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Encrypted private String copilotApiKey;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String copilotEndpoint;

    @JsonView(Views.Internal.class)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Encrypted private String azureOpenaiApiKey;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String azureOpenaiEndpoint;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String azureOpenaiDeploymentName;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String azureOpenaiApiVersion;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private Integer azureOpenaiMaxCompletionTokens;

    @JsonView(Views.Public.class)
    @JsonInclude
    private AIProvider aiProvider;

    @JsonView(Views.Public.class)
    @JsonInclude
    private Boolean isAIAssistantEnabled = false;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String localLlmUrl;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private Integer localLlmContextSize;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String localLlmModel;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String claudeModel;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String claudeBaseUrl;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String openaiModel;

    @JsonView(Views.Internal.class)
    @JsonInclude
    private String openaiBaseUrl;

    public void copyNonSensitiveValues(AIAssistantConfig source) {
        if (source == null) {
            return;
        }
        copilotEndpoint = ObjectUtils.defaultIfNull(source.getCopilotEndpoint(), copilotEndpoint);
        azureOpenaiEndpoint = ObjectUtils.defaultIfNull(source.getAzureOpenaiEndpoint(), azureOpenaiEndpoint);
        azureOpenaiDeploymentName =
                ObjectUtils.defaultIfNull(source.getAzureOpenaiDeploymentName(), azureOpenaiDeploymentName);
        azureOpenaiApiVersion = ObjectUtils.defaultIfNull(source.getAzureOpenaiApiVersion(), azureOpenaiApiVersion);
        azureOpenaiMaxCompletionTokens =
                ObjectUtils.defaultIfNull(source.getAzureOpenaiMaxCompletionTokens(), azureOpenaiMaxCompletionTokens);
        aiProvider = ObjectUtils.defaultIfNull(source.getAiProvider(), aiProvider);
        isAIAssistantEnabled = ObjectUtils.defaultIfNull(source.getIsAIAssistantEnabled(), isAIAssistantEnabled);
        localLlmUrl = ObjectUtils.defaultIfNull(source.getLocalLlmUrl(), localLlmUrl);
        localLlmContextSize = ObjectUtils.defaultIfNull(source.getLocalLlmContextSize(), localLlmContextSize);
        localLlmModel = ObjectUtils.defaultIfNull(source.getLocalLlmModel(), localLlmModel);
        claudeModel = ObjectUtils.defaultIfNull(source.getClaudeModel(), claudeModel);
        claudeBaseUrl = ObjectUtils.defaultIfNull(source.getClaudeBaseUrl(), claudeBaseUrl);
        openaiModel = ObjectUtils.defaultIfNull(source.getOpenaiModel(), openaiModel);
        openaiBaseUrl = ObjectUtils.defaultIfNull(source.getOpenaiBaseUrl(), openaiBaseUrl);
    }
}
