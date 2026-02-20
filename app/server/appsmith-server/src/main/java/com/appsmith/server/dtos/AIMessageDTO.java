package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AIMessageDTO {
    @NotBlank(message = "Role is required")
    private String role; // "user" or "assistant"

    @NotBlank(message = "Content is required")
    @Size(max = 50000, message = "Message content cannot exceed 50000 characters")
    private String content;
}
