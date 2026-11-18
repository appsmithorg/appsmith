package com.appsmith.server.dtos;

import com.appsmith.server.meta.validations.FileName;
import com.appsmith.server.meta.validations.FileNameValidator;
import com.appsmith.server.meta.validations.IconName;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.apache.commons.lang3.StringUtils;

public record PageUpdateDTO(
        @FileName(message = FileNameValidator.INVALID_PAGE_NAME_MESSAGE) @Size(max = 30) String name,
        @IconName String icon,
        @Pattern(regexp = "[-\\w]*") String customSlug,
        Boolean isHidden) {

    public PageDTO toPageDTO() {
        final PageDTO page = new PageDTO();
        page.setName(name == null ? null : name.trim());
        page.setIcon(StringUtils.isBlank(icon) ? null : icon.trim());
        page.setCustomSlug(customSlug);
        page.setIsHidden(isHidden);
        return page;
    }
}
