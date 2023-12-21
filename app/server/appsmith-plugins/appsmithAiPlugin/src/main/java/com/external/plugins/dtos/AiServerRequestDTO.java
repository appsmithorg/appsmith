package com.external.plugins.dtos;

import com.external.plugins.models.Feature;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiServerRequestDTO {
    Feature usecase;
    Query params;
}
