package com.shpms.silverharvestsystem.dto;

import com.shpms.silverharvestsystem.Enum.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class UserDto implements SuperDTO{
    private String userId;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private Role role;
}
