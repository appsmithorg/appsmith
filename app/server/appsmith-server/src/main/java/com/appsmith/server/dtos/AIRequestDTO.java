package com.appsmith.server.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AIRequestDTO {
    @NotBlank(message = "Provider is required")
    private String provider;

    @NotBlank(message = "Prompt is required")
    @Size(max = 10000, message = "Prompt cannot exceed 10000 characters")
    private String prompt;

    @NotNull(message = "Context is required") @Valid
    private AIEditorContextDTO context;
}
