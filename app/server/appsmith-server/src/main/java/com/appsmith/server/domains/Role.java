package com.appsmith.server.domains;


import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotEmpty;


@Document
@Getter
@Setter
@ToString
@AllArgsConstructor
public class Role extends BaseDomain {

    private static final long serialVersionUID = -9218373922209100577L;

    @NotEmpty
    @JsonView(Views.Api.class)
    private String name;
}
