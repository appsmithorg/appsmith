package com.appsmith.server.dtos;

import com.appsmith.external.models.Provider;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProviderPaginatedDTO {
    @JsonView(Views.Api.class)
    List<Provider> providers;

    @JsonView(Views.Api.class)
    Long total;
}
