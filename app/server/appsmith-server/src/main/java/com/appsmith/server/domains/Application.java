package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.querydsl.core.annotations.QueryEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@QueryEntity
@Document
public class Application extends BaseDomain {

    @NotNull
    String name;

    String organizationId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Boolean isPublic = false;

    List<ApplicationPage> pages;

    @Transient
    boolean appIsExample = false;

}
