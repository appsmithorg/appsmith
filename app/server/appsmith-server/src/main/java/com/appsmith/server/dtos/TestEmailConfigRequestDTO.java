package com.appsmith.server.dtos;

import lombok.Data;

@Data
public class TestEmailConfigRequestDTO {
    private String smtpHost;
    private Integer smtpPort;
    private String username;
    private String password;
    private String fromEmail;
}
