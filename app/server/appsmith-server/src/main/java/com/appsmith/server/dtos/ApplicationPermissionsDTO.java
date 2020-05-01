package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ApplicationPermissionsDTO {
    Application application;
    List<String> userPermissions;
}
