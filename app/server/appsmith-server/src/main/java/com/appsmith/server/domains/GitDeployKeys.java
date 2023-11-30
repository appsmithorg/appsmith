package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
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

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    GitAuth gitAuth;
}
