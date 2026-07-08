# 🚀 CodeCampus — Setup & Run Guide

---

## 📋 Prerequisites

| Tool | Required Version | Check Command |
|------|-----------------|---------------|
| Java JDK | 21+ (you have 25) | `java -version` |
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL | 8+ *(optional — H2 works for dev)* | `mysql --version` |

---

## 🔧 FIRST TIME SETUP (Run Once)

### Step 1: Install Maven (if not installed)

```powershell
# Check if Maven exists
mvn --version

# If NOT installed, download it:
$mavenZip = "$env:TEMP\maven.zip"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip" -OutFile $mavenZip
New-Item -ItemType Directory -Force "$env:USERPROFILE\.m2\maven" | Out-Null
Expand-Archive -Path $mavenZip -DestinationPath "$env:USERPROFILE\.m2\maven" -Force
Remove-Item $mavenZip

# Add Maven to PATH (run every new terminal, or add to system PATH permanently)
$env:Path = "$env:USERPROFILE\.m2\maven\apache-maven-3.9.6\bin;$env:Path"

# Verify
mvn --version
```

### Step 2: Install Frontend Dependencies

```powershell
# Map Z: drive (needed because of Windows Cookies junction)
subst Z: "C:\Users\Adarsh\AppData\Local\Microsoft\Windows\INetCookies\Desktop\Compiler_Project"

# Install npm packages
cd Z:\client
npm install --legacy-peer-deps
```

### Step 3: First Backend Build (downloads all Java dependencies)

```powershell
$env:Path = "$env:USERPROFILE\.m2\maven\apache-maven-3.9.6\bin;$env:Path"
cd C:\Users\Adarsh\Cookies\Desktop\Compiler_Project\server
mvn clean compile
```

---

## ▶️ RUN PROJECT (Every Time)

### Terminal 1 — Start Backend

```powershell
$env:Path = "$env:USERPROFILE\.m2\maven\apache-maven-3.9.6\bin;$env:Path"
cd C:\Users\Adarsh\Cookies\Desktop\Compiler_Project\server
mvn spring-boot:run
```

> Backend starts at: **http://localhost:8080**

### Terminal 2 — Start Frontend

```powershell
subst Z: "C:\Users\Adarsh\AppData\Local\Microsoft\Windows\INetCookies\Desktop\Compiler_Project" 2>$null
cd Z:\client
npx vite --port 5173
```

> Frontend starts at: **http://localhost:5173** (or next available port)

---

## 🛑 STOP / RESTART

### Kill Backend (if port 8080 is busy)

```powershell
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Kill Frontend (if port 5173 is busy)

```powershell
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Kill ALL Java processes

```powershell
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 🔗 URLs

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:5173 |
| ⚙️ Backend API | http://localhost:8080 |
| 🐳 Judge0 API | http://localhost:2358 |
| 🗄️ H2 Database Console | http://localhost:8080/h2-console |

### H2 Console Login:
- JDBC URL: `jdbc:h2:mem:codecampus`
- Username: `sa`
- Password: *(leave empty)*

---

## 🔑 Demo Login Accounts

| Role | Username | Password |
|------|----------|----------|
| 🔴 Admin | `admin` | `admin123` |
| 🔵 Teacher | `teacher` | `teacher123` |
| 🟢 Student | `student` | `student123` |
| 🟣 Company | `company` | `company123` |

---

## 🐳 Judge0 Docker — Sandboxed Code Execution (Recommended)

By default, CodeCampus runs user code using locally installed compilers (JDK, GCC, Python, Node).
For **production-grade sandboxed execution**, use Judge0 via Docker:

### Step 1: Install Docker Desktop

Download and install **Docker Desktop** from: https://www.docker.com/products/docker-desktop/

After install, make sure Docker is running (system tray icon).

### Step 2: Start Judge0

```powershell
cd C:\Users\Adarsh\Cookies\Desktop\Compiler_Project
docker compose up -d
```

This starts 4 containers:
- **judge0-server** — Judge0 API at http://localhost:2358
- **judge0-workers** — Code execution workers (sandboxed)
- **judge0-db** — PostgreSQL (Judge0 internal state)
- **redis** — Job queue

First startup takes 2-3 minutes to pull images (~1.5 GB total).

### Step 3: Verify Judge0 is Running

```powershell
# Check health
curl http://localhost:2358/system_info

# Or in browser: http://localhost:2358/system_info
```

### Step 4: Restart Backend

The backend auto-detects Judge0 on startup. Just restart the Spring Boot server:

```powershell
# Terminal 1
$env:Path = "$env:USERPROFILE\.m2\maven\apache-maven-3.9.6\bin;$env:Path"
cd C:\Users\Adarsh\Cookies\Desktop\Compiler_Project\server
mvn spring-boot:run
```

You'll see in the logs:
```
✅ Judge0 connected at http://localhost:2358 — using Docker-based code execution
```

### Docker Commands

```powershell
docker compose up -d      # Start Judge0
docker compose down        # Stop Judge0
docker compose logs -f     # View logs
docker compose ps          # Check status
```

> **Note:** When Docker is NOT running, the backend automatically falls back to local compilers — everything still works!

### Supported Languages (Judge0)

| Language | Judge0 ID | Version |
|----------|-----------|---------|
| C | 50 | GCC 9.2.0 |
| C++ | 54 | GCC 9.2.0 |
| Java | 62 | OpenJDK 13.0.1 |
| Python | 71 | Python 3.8.1 |
| JavaScript | 63 | Node.js 12.14.0 |

---

## 🗄️ Switch to MySQL (Production)

1. Install MySQL and create database:
```sql
CREATE DATABASE codecampus;
```

2. Edit `server/src/main/resources/application.properties`:
```properties
# Comment out H2 lines and uncomment MySQL lines:
spring.datasource.url=jdbc:mysql://localhost:3306/codecampus?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

3. Restart backend.

---

## 📁 Project Structure

```
Compiler_Project/
├── docker-compose.yml               # Judge0 Docker (sandboxed code execution)
├── server/                          # Spring Boot Backend
│   ├── pom.xml                      # Maven dependencies
│   ├── src/main/java/com/codecampus/
│   │   ├── CodeCampusApplication.java
│   │   ├── model/                   # JPA Entities
│   │   ├── repository/              # Data Access
│   │   ├── service/                 # Business Logic
│   │   ├── controller/              # REST APIs
│   │   ├── security/                # JWT Auth
│   │   ├── config/                  # Security + Data Seeder
│   │   └── dto/                     # Request/Response Objects
│   └── src/main/resources/
│       ├── application.properties   # Config
│       ├── problems.json            # 39 coding problems
│       └── studyplans.json          # 12 study plans
│
└── client/                          # React Frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                  # Routes
        ├── components/              # Navbar, ProtectedRoute, ProctoringGuard
        ├── context/                 # AuthContext
        ├── pages/                   # All pages
        └── services/                # API layer (axios)
```

---

## 🧹 Reduce Log Noise

Edit `server/src/main/resources/application.properties`:
```properties
spring.jpa.show-sql=false
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `Port 8080 already in use` | Run the kill command above |
| `mvn not recognized` | Run the `$env:Path = ...` line first |
| `vite not recognized` | Run `npm install --legacy-peer-deps` in Z:\client |
| Frontend shows blank | Make sure backend is running first |
| `Cookies path error` | Always use `subst Z:` for frontend, direct path for backend |
| `Judge0 not reachable` | Run `docker compose up -d` and wait 1-2 min for startup |
| `Judge0 container crash` | Run `docker compose down -v && docker compose up -d` to reset |
