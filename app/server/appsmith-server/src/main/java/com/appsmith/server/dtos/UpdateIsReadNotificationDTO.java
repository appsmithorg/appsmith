/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotNull;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode
public class UpdateIsReadNotificationDTO {

  @NotNull private Boolean isRead;
}
