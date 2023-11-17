package com.external.plugins.models;

import lombok.Data;

@Data
public class UserQuery {
    QueryType type;
    String content;
}
