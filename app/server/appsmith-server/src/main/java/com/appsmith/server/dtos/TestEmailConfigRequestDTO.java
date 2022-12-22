package com.appsmith.server.dtos;

import lombok.Data;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@Data
public class TestEmailConfigRequestDTO {
    @NotNull
    @NotEmpty
    private String smtpHost;

    @NotNull
    private Integer smtpPort;

    private String username;

    private String password;

    @NotNull
    @NotEmpty
    @Email
    private String fromEmail;
}
