package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaginatedNotificationResponseDTO<T> extends ResponseDTO<T> {
    private PaginationDTO pagination;
    private long unreadCount;

    public PaginatedNotificationResponseDTO(int status, T data, String message, boolean success,
                                            PaginationDTO pagination, long unreadCount) {
        super(status, data, message, success);
        this.pagination = pagination;
        this.unreadCount = unreadCount;
    }
}
