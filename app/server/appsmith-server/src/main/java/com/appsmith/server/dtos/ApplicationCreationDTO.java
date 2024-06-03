package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.meta.validations.IconName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.apache.commons.lang3.StringUtils;

public record ApplicationCreationDTO(
        @NotBlank @Size(max = 99) String workspaceId,
        @NotBlank @Size(max = 99) String name,
        @IconName String icon,
        @Pattern(regexp = "#[A-F0-9]{6}") String color,
        Application.AppPositioning positioningType,
        Boolean showNavbar) {

    public Application toApplication() {
        final Application application = new Application();
        application.setWorkspaceId(workspaceId);
        application.setName(name.trim());
        application.setIcon(StringUtils.isBlank(icon) ? null : icon.trim());
        application.setColor(color);

        final ApplicationDetail applicationDetail = new ApplicationDetail();
        application.setApplicationDetail(applicationDetail);

        applicationDetail.setAppPositioning(positioningType);

        final Application.NavigationSetting navigationSetting = new Application.NavigationSetting();
        navigationSetting.setShowNavbar(showNavbar);
        applicationDetail.setNavigationSetting(navigationSetting);

        return application;
    }
}
