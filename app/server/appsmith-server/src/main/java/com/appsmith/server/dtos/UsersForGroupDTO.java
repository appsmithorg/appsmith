package com.appsmith.server.dtos;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.Getter;
import lombok.Setter;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import javax.validation.constraints.NotNull;
import java.util.Set;

import static java.lang.Boolean.TRUE;

@Getter
@Setter
public class UsersForGroupDTO {

    @NotNull
    Set<String> usernames;

    @NotNull
    String groupId;

    public static Mono<Boolean> validate(UsersForGroupDTO usersForGroupDTO) {
        // validate the input
        if (usersForGroupDTO == null) {
            return Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST));
        }

        String id = usersForGroupDTO.getGroupId();
        Set<String> usernames = usersForGroupDTO.getUsernames();

        if (!StringUtils.hasText(id)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.GROUP_ID));
        }
        if (CollectionUtils.isEmpty(usernames)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.USERNAMES));
        }

        return Mono.just(TRUE);
    }

}
