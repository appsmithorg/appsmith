package com.appsmith.server.newpages.projections;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class PageDTOView {
    String name;
    String icon;
    Boolean isHidden;
    String slug;
    String customSlug;
}
