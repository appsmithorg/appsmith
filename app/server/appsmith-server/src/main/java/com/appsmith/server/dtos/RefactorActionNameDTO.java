package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefactorActionNameDTO {
    String actionId;
    String pageId;
    String layoutId;
    String oldName;
    String newName;
}
