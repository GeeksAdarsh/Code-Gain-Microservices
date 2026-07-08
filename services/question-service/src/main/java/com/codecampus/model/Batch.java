package com.codecampus.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "batches")
public class Batch {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String name;

    private int startYear;
    private int endYear;
    private String program;

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Section> sections = new ArrayList<>();

    public Batch() {}
    public Batch(String name, int startYear, int endYear, String program) {
        this.name = name; this.startYear = startYear; this.endYear = endYear; this.program = program;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getStartYear() { return startYear; }
    public void setStartYear(int v) { this.startYear = v; }
    public int getEndYear() { return endYear; }
    public void setEndYear(int v) { this.endYear = v; }
    public String getProgram() { return program; }
    public void setProgram(String v) { this.program = v; }
    public List<Section> getSections() { return sections; }
    public void setSections(List<Section> v) { this.sections = v; }
}
