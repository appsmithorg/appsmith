package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EmailTokenDTO {
    private String email;
    private String token;
}
