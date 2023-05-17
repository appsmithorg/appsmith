package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserCompactDTO {

    String id;

    String username;

    String name;

    String photoId;

    public UserCompactDTO(String id, String username, String name) {
        this.id = id;
        this.username = username;
        this.name = name;
    }
}
