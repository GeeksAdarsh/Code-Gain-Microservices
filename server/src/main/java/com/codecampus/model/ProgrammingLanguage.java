package com.codecampus.model;

public enum ProgrammingLanguage {
    C("c", "gcc"),
    CPP("cpp", "g++"),
    JAVA("java", "javac"),
    PYTHON("py", "python3"),
    JAVASCRIPT("js", "node");

    private final String extension;
    private final String compiler;

    ProgrammingLanguage(String extension, String compiler) {
        this.extension = extension;
        this.compiler = compiler;
    }

    public String getExtension() { return extension; }
    public String getCompiler() { return compiler; }
}
