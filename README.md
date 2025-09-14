# 🌱 Silver Harvest Plantation Monitoring System

![Silver Harvest Front Page](https://github.com/NandikaKW/Silver-Harvest-Plant-Monitoring-System/blob/df2392e555224d8c1a0470fba186549316937765/ReadMeImg-02.png)

## 📖 Overview

The **Silver Harvest Plantation Monitoring System** is a comprehensive web application designed to manage plantation operations by integrating field, crop, staff, equipment, and sales data. This system ensures secure, efficient, and centralized management of plantation activities with role-based access control.

### ✨ Key Features

- **Fields & Crops Management** – Track field details (location, size, images) and crops (common/scientific names, category, season)
- **Staff & Users Management** – Manage staff records with role-based access (Admin, Manager, Scientist, Other)
- **Vehicles & Equipment Tracking** – Record vehicle details (fuel type, license, status) and equipment assignments
- **Monitoring Logs** – Link fields and crops with logs for tracking growth, health, and observations
- **Secure JWT Authentication** – Protected access with token-based authentication
- **Responsive Dashboard** – Clean, intuitive interface built with Bootstrap

---

## 🖼️ Application Screenshots

| Sign In Page | Dashboard | Sign Up Page |
|--------------|-----------|--------------|
| ![Sign In](https://github.com/NandikaKW/Silver-Harvest-Plant-Monitoring-System/blob/df2392e555224d8c1a0470fba186549316937765/ReadMeImg-01.png) | ![Dashboard](https://github.com/NandikaKW/Silver-Harvest-Plant-Monitoring-System/blob/df2392e555224d8c1a0470fba186549316937765/ReadMeImg-04.png) | ![Sign Up](https://github.com/NandikaKW/Silver-Harvest-Plant-Monitoring-System/blob/df2392e555224d8c1a0470fba186549316937765/ReadMeImg-03.png) |

---

## 🚀 Setup Instructions

Follow these steps to install, configure, and run both the frontend and backend applications.

### Prerequisites

Make sure the following are installed on your system:

- Java JDK 17+
- Maven 3.8+
- MySQL (or your preferred database)
- Git
- Web browser with JavaScript enabled

---

## 🔧 Backend Setup (Spring Boot with JWT Authentication)

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Configure the database** in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/SilverHarvest
   spring.datasource.username=root
   spring.datasource.password=Ijse@1234
   
   spring.jpa.hibernate.ddl-auto=update
   spring.jpa.show-sql=true
   
   # JWT configuration
   jwt.secret=MySecretKeyForJWTGenerationMySecretKey
   jwt.expiration=86400000
   ```

3. **Build and run the backend**:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

4. **The backend will be available at**:
   ```
   http://localhost:8080/
   ```

---

## 🎨 Frontend Setup (Bootstrap + jQuery)

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Open `index.html` in your browser**, or use a local server such as **Live Server** in VS Code to run the frontend.

---

## 🔗 Connecting Frontend and Backend

- After a successful login, the backend returns a **JWT token**
- Store the token in `localStorage` on the frontend:
  ```javascript
  localStorage.setItem("jwtToken", response.token);
  ```

- Attach the token in all API requests:
  ```javascript
  $.ajax({
      url: "http://localhost:8080/api/v1/endpoint",
      method: "GET",
      headers: {
          "Authorization": "Bearer " + localStorage.getItem("jwtToken")
      },
      success: function(data) {
          console.log(data);
      }
  });
  ```

---

## 🏃‍♂️ Running the Application

1. **Start the backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Open the frontend** by launching `index.html` in a browser

3. **Log in** → token will be stored → use protected APIs

---

## 🗂️ System Architecture

The application follows a client-server architecture:

- **Frontend**: Bootstrap, jQuery, HTML5, CSS3
- **Backend**: Spring Boot, JPA, MySQL
- **Authentication**: JWT-based security
- **API Communication**: RESTful APIs with JSON payloads

---

## 👥 User Roles

The system supports multiple user roles with different access levels:

- **Admin**: Full system access
- **Manager**: Management capabilities
- **Scientist**: Data analysis and monitoring access
- **Other**: Limited access based on permissions

---

## 📞 Support

For questions or issues regarding setup and usage, please check the application logs or contact the development team.

---

**⚡ Note**: This setup runs the **Spring Boot backend** on `http://localhost:8080` and the **Bootstrap/jQuery frontend** directly in your browser.

---

<div align="center">
  
### 🌿 Cultivating Efficiency in Plantation Management
  
</div>
