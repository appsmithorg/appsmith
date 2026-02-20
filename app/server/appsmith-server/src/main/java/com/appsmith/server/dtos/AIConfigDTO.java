package com.appsmith.server.dtos;

import com.appsmith.server.domains.AIProvider;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AIConfigDTO {
    @Size(max = 500, message = "API key is too long")
    private String claudeApiKey;

    @Size(max = 500, message = "API key is too long")
    private String openaiApiKey;

    @Size(max = 500, message = "API key is too long")
    private String copilotApiKey;

    @Size(max = 2000, message = "Copilot endpoint URL is too long")
    private String copilotEndpoint;

    @NotNull(message = "Provider is required") private AIProvider provider;

    @NotNull(message = "Enabled flag is required") private Boolean isAIAssistantEnabled;

    @Size(max = 2000, message = "URL is too long")
    private String localLlmUrl;

    private Integer localLlmContextSize;

    @Size(max = 200, message = "Model name is too long")
    private String localLlmModel;
}
