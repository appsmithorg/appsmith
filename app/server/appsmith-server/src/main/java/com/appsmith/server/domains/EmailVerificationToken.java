package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class EmailVerificationToken {
    String tokenHash;
    String email;
    Instant tokenGeneratedAt; // verification link is valid for 48 hours
}
