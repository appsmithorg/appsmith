package com.external.plugins.dtos;

import lombok.Data;

import java.util.List;

@Data
public class TextClassificationQuery extends Query {
    List<String> labels;
}
