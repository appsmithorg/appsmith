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
    @JsonView(Views.Public.class)
    List<Provider> providers;

    @JsonView(Views.Public.class)
    Long total;
}
