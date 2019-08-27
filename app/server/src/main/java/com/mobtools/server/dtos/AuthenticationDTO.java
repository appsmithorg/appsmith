package com.mobtools.server.dtos;

import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationDTO {
    String authType;
    String username;
    String password;
}
