package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class FeaturesResponseDTO {
    private Map<String, Boolean> features;
}
