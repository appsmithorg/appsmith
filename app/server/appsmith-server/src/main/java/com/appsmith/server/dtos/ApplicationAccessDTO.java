package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
public class ApplicationAccessDTO {

    @NotNull
    @JsonView(Views.Public.class)
    Boolean publicAccess;

}
