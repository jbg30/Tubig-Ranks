# TubigRanks

TubigRanks is a full-stack competitive ranking and matchmaking platform designed around competitive game systems.

The project focuses on building backend systems for player rankings, matchmaking, authentication, parties, and tournaments.

## Features

* **Elo-based Ranking System**

  * 8 competitive ranks
  * Dynamic K-factor for rating adjustments
  * Player rating updates based on match results

* **Competitive Matchmaking**

  * Skill-based matchmaking using player ratings
  * Queue management
  * Party-based matchmaking

* **Tournament System**

  * Tournament creation and management
  * Automated bracket generation
  * Match progression and results

* **Authentication**

  * Secure user authentication
  * JWT-based authorization
  * Protected API routes

* **REST API**

  * Node.js and Express backend
  * Structured API endpoints for users, matches, rankings, and tournaments

* **Web Application**

  * React frontend
  * Real-time competitive information
  * Player rankings and match information

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express
* JavaScript / TypeScript
* REST API

### Database

* MongoDB

### Authentication

* JWT
* Clerk

### Deployment

* Render

## Architecture

```text
React + TypeScript
        │
        ▼
     REST API
        │
        ▼
Node.js + Express
        │
        ▼
     MongoDB
```

The backend handles core competitive systems including matchmaking, ranking calculations, tournament management, authentication, and player data.

## Project Goals

TubigRanks was built to explore the backend engineering challenges involved in competitive multiplayer systems, including:

* Ranking and rating algorithms
* Matchmaking logic
* Queue management
* Tournament systems
* API design
* Database design
* Authentication and authorization
* Real-time competitive features

## Status

🚧 **In Development**

The project is actively being improved with additional backend features, matchmaking improvements, and system optimizations.

## Author

**Jared Gonzales**

Computer Science & Engineering — UC Merced
