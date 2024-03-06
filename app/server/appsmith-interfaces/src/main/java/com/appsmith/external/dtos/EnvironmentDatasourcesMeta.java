package com.appsmith.external.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class EnvironmentDatasourcesMeta {

    Long configuredDatasources;

    Long totalDatasources;
}
