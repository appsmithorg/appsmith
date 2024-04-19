package com.appsmith.server.dtos;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PageUpdateDTO(
        @Pattern(regexp = "[^/\\\\:]+", message = "/, \\, : not allowed in page names") @Size(max = 30) String name,
        @Pattern(regexp = "[-a-z]+") @Size(max = 20) String icon,
        @Pattern(regexp = "[-\\w]*") String customSlug,
        Boolean isHidden) {

    public PageDTO toPageDTO() {
        final PageDTO page = new PageDTO();
        page.setName(name);
        page.setIcon(icon);
        page.setCustomSlug(customSlug);
        page.setIsHidden(isHidden);
        return page;
    }
}
