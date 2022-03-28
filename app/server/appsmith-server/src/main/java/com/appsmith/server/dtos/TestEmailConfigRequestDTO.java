package com.appsmith.server.dtos;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

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
