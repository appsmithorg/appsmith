package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class PasswordResetToken extends BaseDomain {

    String tokenHash;

    //Password Reset Token should be valid only for a specified amount of time.
    @Indexed(unique = true, expireAfterSeconds = 3600)
    String email;
}
