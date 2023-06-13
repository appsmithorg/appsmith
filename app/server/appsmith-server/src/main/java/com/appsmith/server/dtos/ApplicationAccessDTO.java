/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ApplicationAccessDTO {

    @NotNull Boolean publicAccess;
}
