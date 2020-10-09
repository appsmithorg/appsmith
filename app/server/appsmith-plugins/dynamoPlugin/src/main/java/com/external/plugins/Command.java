package com.external.plugins;

import lombok.Data;

import java.util.Map;

@Data
public class Command {
    private String action;
    private Map<String, Object> parameters;
}
