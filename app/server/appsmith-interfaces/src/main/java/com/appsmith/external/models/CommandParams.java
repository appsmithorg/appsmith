package com.appsmith.external.models;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
public class CommandParams {
    @JsonView(Views.Public.class)
    List<Param> queryParams;

    @JsonView(Views.Public.class)
    List<Param> headerParams;
}

