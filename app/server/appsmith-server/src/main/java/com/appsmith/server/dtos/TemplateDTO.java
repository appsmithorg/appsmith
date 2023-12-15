package com.appsmith.server.dtos;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TemplateDTO extends BaseDomain {
    String applicationId;
    String workspaceId;
    String branchName;
    String title;
    String headline;
    String description;
    List<String> useCases;
    String authorEmail;
    String appUrl;
}
