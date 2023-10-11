package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.UserUpdateDTO_CE;
import lombok.Data;

/**
 * Includes **only** those fields that can be updated for a user, via an API call.
 */
@Data
public class UserUpdateDTO extends UserUpdateDTO_CE {}
