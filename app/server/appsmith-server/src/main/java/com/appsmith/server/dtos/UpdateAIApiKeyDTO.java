package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateAIApiKeyDTO {
    @NotBlank(message = "API key is required")
    @Size(max = 500, message = "API key is too long")
    private String apiKey;
}
