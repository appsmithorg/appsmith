/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import com.appsmith.external.models.Provider;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProviderPaginatedDTO {
List<Provider> providers;
Long total;
}
