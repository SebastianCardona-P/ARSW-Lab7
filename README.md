
# Blueprint Management System

## Overview

This project is a blueprint management system built with Spring Boot. It allows users to create, retrieve, update, and delete blueprints. Blueprints are composed of a series of points that form drawings, and this application supports real-time updates to the drawings using WebSockets and STOMP.

### Key Features:
- **Blueprint CRUD operations**: Manage blueprints through REST APIs.
- **Real-time drawing**: Use WebSockets for real-time updates to drawings with points and polygons.
- **Security**: Cross-Origin Resource Sharing (CORS) configuration to allow communication from specific origins.
  
## Technologies Used
- **Spring Boot**: Backend framework for building the REST API.
- **WebSockets and STOMP**: For real-time communication of drawing points and polygons.
- **Spring Security**: Basic security features.
- **Swagger**: API documentation.

## Architecture
The application is built using the following components:
1. **BlueprintsController**: Manages blueprint CRUD operations via REST.
2. **WebSocketConfig**: Configures WebSocket endpoints for real-time drawing updates.
3. **CorsConfig**: Manages Cross-Origin Resource Sharing (CORS) policies for frontend communication.
4. **BlueprintsServices**: Handles business logic related to blueprints.
5. **Models**: Includes `Blueprint`, `Point`, and other domain models representing blueprints and drawing points.


### Run back

1. Clone the repository:
    ```
    git clone <repository-url>
    cd blueprint-management-system
    ```

2. Build the project using Maven:
    ```
    mvn clean install
    ```

3. Run the application:
    ```
    mvn spring-boot:run
    ```

    The application will be accessible at `http://localhost:8080`.

### CORS Configuration
The application is configured to allow CORS requests from the following origins:
- `http://localhost:5173`


### WebSocket
WebSockets are enabled with the STOMP protocol for real-time updates. You can connect to the WebSocket server at the endpoint `/ws`.

### API Endpoints
- **GET /blueprints**: Retrieve all blueprints.
- **GET /blueprints/{author}/{name}**: Retrieve a specific blueprint by author and name.
- **POST /blueprints**: Create a new blueprint.
- **PUT /blueprints/{author}/{name}**: Update an existing blueprint.
- **DELETE /blueprints/{author}/{name}**: Delete a blueprint.

### Real-Time Drawing
When a new point is added to a blueprint, it is broadcasted to all connected clients using the endpoint `/topic/newpoint/{author}/{name}`. If enough points are gathered (>= 4), a polygon is created and broadcasted to `/topic/newpolygon/{author}/{name}`.

## Models

- **Blueprint**: Represents a blueprint with an author, name, and list of points.
- **Point**: Represents a point in a 2D Cartesian coordinate system with x and y values.

## Example Requests

### Create a new blueprint:
```bash
POST /blueprints
{
    "author": "Marcos",
    "name": "Edificio G",
    "points": [{"x": 1, "y": 2}, {"x": 3, "y": 4}]
}
```

### Get a blueprint by author and name:
```bash
GET /blueprints/Msrcos/EdificioG
```

The application will be accessible at `http://localhost:3000`.

# Front

### Components
1. **Blueprints.tsx**: The main component responsible for managing blueprints. It handles the creation of new blueprints and displays the list of blueprints for a specific author.
2. **PolygonHandler.tsx**: Responsible for handling and rendering polygons on the canvas using points received from the WebSocket server.
3. **App.tsx**: The main entry point of the React app, which renders the `Blueprints` component.
4. **CSS Files**: Various CSS files are used to style the application, such as `App.css` for general layout and `Blueprints.css` for blueprint-specific styles.

### WebSocket Configuration
The app uses STOMP and WebSockets for real-time collaboration. The connection is handled through `StompClient.tsx`, which manages the WebSocket connection and subscriptions to topics like `/topic/newpoint`.

### Comando para crear el proyecto

```bash
npm create vite@latest static --template react

```
### Run Front

```bash
npm install
npm run dev
```
