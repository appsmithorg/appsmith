package com.appsmith.server.domains;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@ToString
@Getter
@Setter
@AllArgsConstructor
public class Bookmark {
    String entityId;
    String entityType;
    String lineNo;
    String fieldName;
}
