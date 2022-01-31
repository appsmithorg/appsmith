package com.appsmith.server.dtos;

import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.server.domains.Application;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitPullDTO {

    Application application;

    MergeStatusDTO mergeStatus;
}
