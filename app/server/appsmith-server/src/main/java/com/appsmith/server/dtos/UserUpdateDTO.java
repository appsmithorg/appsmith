package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.UserUpdateCE_DTO;
import lombok.Data;

/**
 * Includes **only** those fields that can be updated for a user, via an API call.
 */
@Data
public class UserUpdateDTO extends UserUpdateCE_DTO {}
