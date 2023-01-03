package com.appsmith.server.domains;

import jakarta.validation.constraints.NotNull;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode
public class UserInGroup {
    
    @NotNull
    private String userId;

    @NotNull
    private String email;
}
