package com.appsmith.server.dtos;

import com.appsmith.server.meta.validations.FileName;
import com.appsmith.server.meta.validations.IconName;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PageUpdateDTO(
        @FileName(message = "Page names must be valid file names") @Size(max = 30) String name,
        @IconName String icon,
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
