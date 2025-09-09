package com.shpms.silverharvestsystem.controller;


import com.shpms.silverharvestsystem.JwtUtil;
import com.shpms.silverharvestsystem.dto.UserDto;
import com.shpms.silverharvestsystem.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    @Autowired
    private com.shpms.silverharvestsystem.repository.UserRepo userRepo;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public String register(@RequestBody UserDto userDto) {
        User user = new User();
        user.setUserId(userDto.getUserId());
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        user.setEmail(userDto.getEmail());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setRole(userDto.getRole());

        userRepo.save(user);
        return "User registered successfully!";
    }

    @PostMapping("/signin")
    public String login(@RequestBody UserDto userDto) {
        User user = userRepo.findByEmail(userDto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (passwordEncoder.matches(userDto.getPassword(), user.getPassword())) {
            return jwtUtil.generateToken(user.getEmail(), user.getRole().toString());
        } else {
            throw new RuntimeException("Invalid credentials");
        }
    }
}
