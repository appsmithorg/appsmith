package com.appsmith.server.dtos;

import com.appsmith.server.domains.User;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResendEmailVerificationDTO extends User {
    String baseUrl;

    @NotEmpty
    String token;
}
