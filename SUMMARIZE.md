# Workspace Summary: Xi4Seat

## Project Overview
**Xi4Seat** is a modern seating chart management system designed for class XI-4. It allows for dynamic seat reshuffling while maintaining specific constraints (like gender-based pairing) and provides a history of previous layouts.

## Key Features
- **Smart Reshuffle**: Automatically shuffles seating while keeping gender pairs (Male-Male, Female-Female).
- **Server-Side Persistence**: Layouts are saved as JSON files on the server.
- **History Tracking**: A dedicated page to view and preview previous seating configurations.
- **Activity Logging**: Logs every reshuffle action for transparency.
- **Modern UI**: Uses a responsive Glassmorphism design with CSS animations.

## Tech Stack
- **Backend**: Node.js with Express.js.
- **Frontend**: Vanilla HTML, CSS, and JavaScript.
- **Storage**: File-based JSON storage (using `fs-extra`).
- **Deployment**: Includes Docker and Docker Compose support.

## Project Structure
- `server.js`: The main Express server handling API endpoints and data management.
- `index.html`: The main dashboard for viewing the seating chart.
- `groups.html` & `shuffler.html`: Additional views for grouping and shuffling logic.
- `history.html`: View for historical seating configurations.
- `script.js`, `groups.js`, `history.js`: Frontend logic for respective pages.
- `style.css`: Global styling using modern CSS features.
- `name.csv` & `name-simple.csv`: Data files containing student names and gender information.
- `current.json`: Stores the current active seating layout.
- `history_output.json`: Stores the history of generated layouts.
- `Dockerfile` & `docker-compose.yml`: Configuration for containerized deployment.

## Recent Activity
Based on the file list, the project is structured as a complete full-stack application ready for local development or containerized deployment.
