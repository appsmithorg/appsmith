package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;


@Getter
@Setter
@NoArgsConstructor
@Document
public class EnvironmentVariable extends BaseDomain {


    String environmentId;

    String applicationId;

    String workspaceId;

    String name;

    //subject to type change;

    @Encrypted
    String value;

}
