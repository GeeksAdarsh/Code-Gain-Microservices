package com.codecampus.repository;

import com.codecampus.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {
    Optional<Batch> findByName(String name);
    Optional<Batch> findByStartYear(int startYear);
    boolean existsByName(String name);
}
