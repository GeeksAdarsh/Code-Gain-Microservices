package com.codecampus.repository;

import com.codecampus.model.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByBatchId(Long batchId);
    List<Section> findByTeachersId(Long teacherId);
    Optional<Section> findByNameAndBatchId(String name, Long batchId);
}
