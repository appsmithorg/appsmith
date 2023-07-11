package com.appsmith.server.dtos;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.ProvisionResourceMetadata;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProvisionResourceDto {
    BaseDomain resource;
    ProvisionResourceMetadata metadata;
}
