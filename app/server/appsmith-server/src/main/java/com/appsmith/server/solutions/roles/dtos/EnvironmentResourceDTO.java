package com.appsmith.server.solutions.roles.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class EnvironmentResourceDTO extends BaseView {

    // This will be used to provide color coding for each environment
    String colorCode;
}
