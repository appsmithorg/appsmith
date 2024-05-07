package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@EqualsAndHashCode(callSuper = true)
@Document
public class GitDeployKeys extends BaseDomain {
    String email;

    GitAuth gitAuth;
}
