package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitPullDTO {

    Application application;

    String pullStatus;
}
