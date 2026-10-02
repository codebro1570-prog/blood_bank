package com.bloodbank.user;

import com.bloodbank.common.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    java.util.List<User> findByRoleAndActiveTrue(Role role);

    @Query("""
        SELECT u FROM User u
        WHERE (:role is null or u.role = :role)
          AND (:active is null or u.active = :active)
          AND (:q is null or lower(u.email) like lower(concat('%', :q, '%'))
                          or lower(u.fullName) like lower(concat('%', :q, '%')))
        """)
    Page<User> search(@Param("role") Role role,
                      @Param("active") Boolean active,
                      @Param("q") String q,
                      Pageable pageable);
}
