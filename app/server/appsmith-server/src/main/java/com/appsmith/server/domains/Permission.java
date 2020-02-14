package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;

@Getter
@Setter
@ToString
@Document
public class Permission extends BaseDomain {

    @NotNull
    private String name;

    private String description;
}
