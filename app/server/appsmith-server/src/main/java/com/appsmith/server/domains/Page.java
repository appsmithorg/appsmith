package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@Deprecated
public class Page extends BaseDomain {
    @JsonView(Views.Api.class)
    String name;

    @NotNull
    @JsonView(Views.Api.class)
    String applicationId;

    @JsonView(Views.Api.class)
    List<Layout> layouts;
}
