package com.codecampus.model;

import jakarta.persistence.*;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "sections")
public class Section {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;

    // A section can have multiple teachers. Any assigned teacher can manage the
    // section's students and the students see tests created by any of them.
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "section_teachers",
        joinColumns = @JoinColumn(name = "section_id"),
        inverseJoinColumns = @JoinColumn(name = "teacher_id"))
    private Set<User> teachers = new LinkedHashSet<>();

    public Section() {}
    public Section(String name, Batch batch) { this.name = name; this.batch = batch; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Batch getBatch() { return batch; }
    public void setBatch(Batch batch) { this.batch = batch; }

    public Set<User> getTeachers() { return teachers; }
    public void setTeachers(Set<User> teachers) { this.teachers = teachers; }
    public void addTeacher(User teacher) { if (teacher != null) this.teachers.add(teacher); }
    public boolean removeTeacher(Long teacherId) { return this.teachers.removeIf(t -> t.getId().equals(teacherId)); }
    public boolean hasTeacher(Long teacherId) { return this.teachers.stream().anyMatch(t -> t.getId().equals(teacherId)); }

    public String getFullName() { return batch != null ? batch.getName() + " - " + name : name; }
}
