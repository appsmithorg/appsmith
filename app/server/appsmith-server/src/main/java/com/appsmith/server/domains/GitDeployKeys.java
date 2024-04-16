package com.appsmith.server.domains;

import lombok.Data;

@Data
public class GitDeployKeys {
    String email;

    GitAuth gitAuth;
}
