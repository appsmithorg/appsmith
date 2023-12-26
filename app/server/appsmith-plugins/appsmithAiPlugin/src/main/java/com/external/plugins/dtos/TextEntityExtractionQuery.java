package com.external.plugins.dtos;

import lombok.Data;

import java.util.List;

@Data
public class TextEntityExtractionQuery extends Query {
    private List<String> labels;
}
