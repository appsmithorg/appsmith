package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
public class CommandQueryParams {
    @JsonView(Views.Api.class)
    List<OldParam> queryOldParams;

    @JsonView(Views.Api.class)
    List<OldParam> headerOldParams;
}
