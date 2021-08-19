package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitConfig {
    String userName;

    String commitEmail;

    String password;

    String remoteUrl;

    String sshKey;
}
