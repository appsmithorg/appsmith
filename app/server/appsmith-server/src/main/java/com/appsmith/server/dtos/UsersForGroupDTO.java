package com.appsmith.server.dtos;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import static java.lang.Boolean.TRUE;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UsersForGroupDTO {

    @NotNull Set<String> usernames;

    List<String> userIds;

    @NotNull Set<String> groupIds;

    public UsersForGroupDTO(Set<String> usernames, Set<String> groupIds) {
        this.usernames = usernames;
        this.groupIds = groupIds;
    }

    public static Mono<Boolean> validate(UsersForGroupDTO usersForGroupDTO) {
        // validate the input
        if (usersForGroupDTO == null) {
            return Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST));
        }

        Set<String> ids = usersForGroupDTO.getGroupIds();
        Set<String> usernames = usersForGroupDTO.getUsernames();

        if (CollectionUtils.isEmpty(ids)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.GROUP_ID));
        }
        if (CollectionUtils.isEmpty(usernames)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAMES));
        }

        return Mono.just(TRUE);
    }
}
