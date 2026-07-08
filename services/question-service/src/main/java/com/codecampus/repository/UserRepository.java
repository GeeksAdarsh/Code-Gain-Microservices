package com.codecampus.repository;

import com.codecampus.model.Role;
import com.codecampus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findBySystemId(String systemId);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsBySystemId(String systemId);
    List<User> findByRole(Role role);
    long countByRole(Role role);
    List<User> findBySectionId(Long sectionId);
    List<User> findByBatchId(Long batchId);
    List<User> findBySectionIdAndIsDebarredFalse(Long sectionId);

    @Query("SELECT DISTINCT u.track FROM User u WHERE u.track IS NOT NULL AND u.track <> '' ORDER BY u.track")
    List<String> findDistinctTracks();
}
