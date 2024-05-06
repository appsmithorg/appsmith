package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.meta.validations.IconName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ApplicationCreationDTO(
        @NotBlank @Size(max = 99) String workspaceId,
        @NotBlank @Size(max = 99) String name,
        @IconName String icon,
        @Pattern(regexp = "#[A-F0-9]{6}") String color,
        Application.AppPositioning positioning) {

    public Application toApplication() {
        final Application application = new Application();
        application.setWorkspaceId(workspaceId);
        application.setName(name.trim());
        application.setIcon(icon);
        application.setColor(color);
        final ApplicationDetail applicationDetail = new ApplicationDetail();
        applicationDetail.setAppPositioning(positioning);
        application.setApplicationDetail(applicationDetail);
        return application;
    }
}
