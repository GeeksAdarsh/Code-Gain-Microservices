@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM Begin all REM://mvnw.cmd
@REM env/vars: JAVA_HOME, MAVEN_OPTS, MAVEN_BATCH_ECHO, MAVEN_BATCH_PAUSE, MAVEN_CMD_LINE_ARGS

@REM Maven Wrapper script for Windows
@echo off

@setlocal

set ERROR_CODE=0

@REM To isolate internal variables from possible post scripts, we use another setlocal
@setlocal

@REM ==== START VALIDATION ====
if NOT "%JAVA_HOME%"=="" goto OkJHome
for %%i in (java.exe) do set "JAVACMD=%%~$PATH:i"
goto checkJCmd

:OkJHome
set "JAVACMD=%JAVA_HOME%\bin\java.exe"

:checkJCmd
if exist "%JAVACMD%" goto chkMHome
echo The JAVA_HOME environment variable is not defined correctly, >&2
echo this environment variable is needed to run this program. >&2
goto error

:chkMHome
set "MAVEN_PROJECTBASEDIR=%~dp0"

@REM Find the project basedir
:findBaseDir
if exist "%MAVEN_PROJECTBASEDIR%\.mvn" goto baseDirFound
cd ..
set "MAVEN_PROJECTBASEDIR=%cd%"
goto findBaseDir

:baseDirFound
set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

@REM ==== DOWNLOAD WRAPPER ====
set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set "WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"

@REM Download maven-wrapper.jar if not present
if exist "%WRAPPER_JAR%" goto runWrapper

echo Downloading Maven Wrapper...

@REM Download wrapper jar
for /f "tokens=1,2 delims==" %%a in (%WRAPPER_PROPERTIES%) do (
    if "%%a"=="wrapperUrl" set WRAPPER_URL=%%b
)

"%JAVACMD%" -cp "%MAVEN_PROJECTBASEDIR%" ^
    -Dfile.encoding=UTF-8 ^
    -jar "%WRAPPER_JAR%" 2>NUL

if not exist "%WRAPPER_JAR%" (
    echo Downloading wrapper jar from %WRAPPER_URL%...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'}"
)

@REM ==== DOWNLOAD MAVEN ====
@REM Try to use wrapper jar, if not, download Maven directly
if exist "%WRAPPER_JAR%" (
    "%JAVACMD%" ^
        %MAVEN_OPTS% ^
        -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" ^
        -cp "%WRAPPER_JAR%" ^
        org.apache.maven.wrapper.MavenWrapperMain %*
    if ERRORLEVEL 1 goto fallback
    goto end
)

:fallback
@REM Fallback: Download and use Maven directly
set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6"
set "MVN_CMD=%MAVEN_HOME%\bin\mvn.cmd"

if exist "%MVN_CMD%" goto runMaven

echo Maven not found. Downloading Apache Maven 3.9.6...
set "MAVEN_ZIP=%TEMP%\apache-maven-3.9.6-bin.zip"

for /f "tokens=1,2 delims==" %%a in (%WRAPPER_PROPERTIES%) do (
    if "%%a"=="distributionUrl" set DIST_URL=%%b
)

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%DIST_URL%' -OutFile '%MAVEN_ZIP%'}"
echo Extracting Maven...
powershell -Command "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%USERPROFILE%\.m2\wrapper\dists' -Force"
del "%MAVEN_ZIP%"

:runMaven
"%MVN_CMD%" %* -f "%MAVEN_PROJECTBASEDIR%\pom.xml"
if ERRORLEVEL 1 goto error
goto end

:runWrapper
"%JAVACMD%" ^
    %MAVEN_OPTS% ^
    -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" ^
    -cp "%WRAPPER_JAR%" ^
    org.apache.maven.wrapper.MavenWrapperMain %*
if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%

cmd /C exit /B %ERROR_CODE%
