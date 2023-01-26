package com.appsmith.server.dtos;

import lombok.Data;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@Data
public class TestEmailConfigRequestDTO {
    @NotNull
    @NotEmpty
    @JsonView(Views.Public.class)
    private String smtpHost;

    @NotNull
    @JsonView(Views.Public.class)
    private Integer smtpPort;

    @JsonView(Views.Public.class)
    private String username;

    @JsonView(Views.Public.class)
    private String password;

    @NotNull
    @NotEmpty
    @Email
    @JsonView(Views.Public.class)
    private String fromEmail;
}
