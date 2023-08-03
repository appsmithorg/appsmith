package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserCompactDTO {

    String id;

    String username;

    String name;

    String photoId;

    @JsonProperty("isProvisioned")
    boolean isProvisioned;

    public UserCompactDTO(String id, String username, String name) {
        this.id = id;
        this.username = username;
        this.name = name;
    }
}
