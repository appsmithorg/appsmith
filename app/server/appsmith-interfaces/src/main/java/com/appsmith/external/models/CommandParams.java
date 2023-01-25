package com.appsmith.external.models;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
public class CommandParams {
    @JsonView(Views.Api.class)
    List<Param> queryParams;

    @JsonView(Views.Api.class)
    List<Param> headerParams;
}

