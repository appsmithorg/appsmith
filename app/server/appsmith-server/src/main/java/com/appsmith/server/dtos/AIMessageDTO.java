package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AIMessageDTO {
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(user|assistant)$", message = "Role must be 'user' or 'assistant'")
    private String role;

    @NotBlank(message = "Content is required")
    @Size(max = 50000, message = "Message content cannot exceed 50000 characters")
    private String content;
}
