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

    @NotNull(message = "Provider is required") private AIProvider provider;

    @NotNull(message = "Enabled flag is required") private Boolean isAIAssistantEnabled;

    @Size(max = 2000, message = "URL is too long")
    private String localLlmUrl;

    private Integer localLlmContextSize;
}
