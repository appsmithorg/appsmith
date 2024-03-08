package com.appsmith.server.domains;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

@Getter
@Setter
@ToString
@Entity
public class GitDeployKeys extends BaseDomain {
    String email;

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    GitAuth gitAuth;
}
