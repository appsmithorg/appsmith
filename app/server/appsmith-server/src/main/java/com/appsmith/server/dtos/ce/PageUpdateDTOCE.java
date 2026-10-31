package com.appsmith.server.dtos.ce;

import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.meta.validations.FileName;
import com.appsmith.server.meta.validations.IconName;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;

@Data
public class PageUpdateDTOCE {
    @FileName(message = "Page names must be valid file names")
    @Size(max = 30) private String name;

    @IconName
    private String icon;

    @Pattern(regexp = "[-\\w]*") private String customSlug;

    private Boolean isHidden;

    public PageDTO toPageDTO() {
        final PageDTO page = new PageDTO();
        page.setName(name == null ? null : name.trim());
        page.setIcon(StringUtils.isBlank(icon) ? null : icon.trim());
        page.setCustomSlug(customSlug);
        page.setIsHidden(isHidden);
        return page;
    }
}
