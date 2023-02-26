package com.appsmith.server.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
public class UpdateIsReadNotificationByIdDTO extends UpdateIsReadNotificationDTO {
    @NotNull
    @NotEmpty
    private List<String> idList;
}
