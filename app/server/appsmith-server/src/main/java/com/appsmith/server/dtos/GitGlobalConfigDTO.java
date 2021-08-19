package com.appsmith.server.dtos;
;
import com.appsmith.server.domains.GitConfig;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitGlobalConfigDTO {

    String userEmail;

    String password;

    String remoteUrl;

    boolean isSshKey;

    String sshKey;

    String organizationId;

}
