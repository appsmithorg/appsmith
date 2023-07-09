package com.appsmith.server.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TestEmailConfigRequestDTO {
    @NotNull @NotEmpty
    private String smtpHost;

    @NotNull private Integer smtpPort;

    private String username;

    private String password;

    @NotNull @NotEmpty
    @Email
    private String fromEmail;

    @NotNull private Boolean starttlsEnabled;
}
