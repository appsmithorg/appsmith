package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
public class ActionViewDTO {
    String id;
    String name;
    String pageId;
    Set<String> jsonPathKeys;
}
