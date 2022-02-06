package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefactorActionNameDTO {
    String actionId;
    String pageId;
    String layoutId;
    String oldName;
    String newName;
    String collectionName;
}
