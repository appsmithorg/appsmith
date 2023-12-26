package com.external.plugins.dtos;

import lombok.Data;

import java.util.List;

@Data
public class Query {
    String input;
    List<String> labels;
}
