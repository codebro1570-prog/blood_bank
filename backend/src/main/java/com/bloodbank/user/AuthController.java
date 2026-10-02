package com.bloodbank.user;

import com.bloodbank.user.dto.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/auth", "/auth"})
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/donor")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthUserResponse registerDonor(@Valid @RequestBody RegisterDonorRequest req) {
        return authService.registerDonor(req);
    }

    @PostMapping("/register/hospital")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthUserResponse registerHospital(@Valid @RequestBody RegisterHospitalRequest req) {
        return authService.registerHospital(req);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    public AuthUserResponse me() {
        return authService.me();
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    public void changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        authService.changePassword(req);
    }
}
