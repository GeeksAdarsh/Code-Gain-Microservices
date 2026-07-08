package com.codecampus.model;

public enum ProctoringEventType {
    TEST_STARTED,
    TEST_SUBMITTED,
    TAB_SWITCH,
    FULLSCREEN_EXIT,
    CAMERA_SNAPSHOT,
    CAMERA_BLOCKED,
    COPY_PASTE_DETECTED,
    RIGHT_CLICK_DETECTED,
    MULTIPLE_FACES_DETECTED,
    NO_FACE_DETECTED,
    SUSPICIOUS_ACTIVITY,
    AUTO_SUBMITTED  // auto-submit due to too many violations
}
