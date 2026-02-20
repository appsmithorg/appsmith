package com.appsmith.server.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AIEditorContextDTO {
    @Size(max = 200, message = "Function name cannot exceed 200 characters")
    private String functionName;

    @Min(value = 0, message = "Cursor line number must be non-negative")
    @Max(value = 1000000, message = "Cursor line number is too large")
    private Integer cursorLineNumber;

    @Size(max = 50000, message = "Function string cannot exceed 50000 characters")
    private String functionString;

    @Size(max = 100, message = "Mode cannot exceed 100 characters")
    private String mode;

    @Size(max = 100000, message = "Current value cannot exceed 100000 characters")
    private String currentValue;
}
