package com.appsmith.server.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AIEditorContextDTO {
    @Size(max = 200, message = "Function name cannot exceed 200 characters") private String functionName;

    @Min(value = 0, message = "Cursor line number must be non-negative") @Max(value = 1000000, message = "Cursor line number is too large") private Integer cursorLineNumber;

    @Size(max = 50000, message = "Function string cannot exceed 50000 characters") private String functionString;

    @Size(max = 100, message = "Mode cannot exceed 100 characters") private String mode;

    @Size(max = 100000, message = "Current value cannot exceed 100000 characters") private String currentValue;

    /**
     * Unpublished action id when the AI panel was opened from a query (or other) editor — used
     * server-side to resolve datasource and inject schema. Optional for backward compatibility.
     */
    @Size(max = 100, message = "Entity id cannot exceed 100 characters") private String entityId;

    /**
     * The application whose editor the request came from. Ask AI only exists in the editor — there is no surface for
     * it in a deployed app — so every legitimate request has one, and it is what a request with no {@code entityId}
     * (a widget property binding, say) is authorized against.
     */
    @Size(max = 100, message = "Application id cannot exceed 100 characters") private String applicationId;

    @Size(max = 15000, message = "Database schema cannot exceed 15000 characters") private String databaseSchema;

    @Size(max = 100, message = "Datasource type cannot exceed 100 characters") private String datasourceType;
}
