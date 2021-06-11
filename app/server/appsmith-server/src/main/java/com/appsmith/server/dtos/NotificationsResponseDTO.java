package com.appsmith.server.dtos;

import com.appsmith.server.domains.Notification;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
public class NotificationsResponseDTO extends ResponseDTO<List<Notification>> implements Serializable {
    private PaginationDTO pagination;
    private long unreadCount;

    public NotificationsResponseDTO(int status, List<Notification> data, String message, boolean success,
                                    PaginationDTO pagination, long unreadCount) {
        super(status, data, message, success);
        this.pagination = pagination;
        this.unreadCount = unreadCount;
    }
}
