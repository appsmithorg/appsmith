package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityTemplateUploadDTO {
    ApplicationTemplate applicationTemplate;
    ApplicationJson appJson;
    String sourceApplicationId;
}
