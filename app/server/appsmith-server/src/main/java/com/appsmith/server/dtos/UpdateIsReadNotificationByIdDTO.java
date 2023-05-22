/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
public class UpdateIsReadNotificationByIdDTO extends UpdateIsReadNotificationDTO {
@NotNull @NotEmpty private List<String> idList;
}
