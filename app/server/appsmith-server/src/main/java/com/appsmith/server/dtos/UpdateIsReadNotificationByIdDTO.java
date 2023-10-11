package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
public class UpdateIsReadNotificationByIdDTO extends UpdateIsReadNotificationDTO {
    @NotNull @NotEmpty
    private List<String> idList;
}
