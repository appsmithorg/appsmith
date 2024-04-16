package com.appsmith.server.domains;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Column;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Type;

@Data
@EqualsAndHashCode(callSuper = true)
public class GitDeployKeys extends BaseDomain {
    String email;

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    GitAuth gitAuth;
}
