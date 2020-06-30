package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AddItemToPageDTO {
    String name;
    String pageId;
    String organizationId;
    ItemDTO marketplaceElement;
}
