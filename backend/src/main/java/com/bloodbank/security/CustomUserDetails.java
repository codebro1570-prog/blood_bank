package com.bloodbank.security;

import com.bloodbank.common.enums.Role;
import com.bloodbank.user.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {
    private final Long id;
    private final String email;
    private final String passwordHash;
    private final Role role;
    private final boolean active;

    public CustomUserDetails(User u) {
        this.id = u.getId();
        this.email = u.getEmail();
        this.passwordHash = u.getPasswordHash();
        this.role = u.getRole();
        this.active = u.isActive();
    }

    public Long getId() { return id; }
    public Role getRole() { return role; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isEnabled() { return active; }
}