Todo Application
A full-stack Todo application built with React, Node.js (Express), and MySQL.

🚀 Features
Create Task: Add new tasks with title and description.
View Tasks: See the 5 most recent active tasks.
Complete Task: Mark tasks as done (removes them from the active list).
Responsive UI: Built with Tailwind CSS and Framer Motion.
🛠 Tech Stack
Frontend: React, Tailwind CSS, Axios
Backend: Node.js, Express, MySQL2
Database: MySQL 8.0
Testing: Jest, Supertest, React Testing Library, Cypress
🏁 Quick Start (Docker)
The easiest way to run the entire application is using Docker.

Prerequisites: Install Docker Desktop.
Run:
docker-compose up --build
Access:
Frontend: http://localhost:3000
Backend API: http://localhost:5000
PhpMyAdmin: http://localhost:8080 (User: root, Password: root)
💻 Local Setup (Without Docker)
1. Database Setup
Ensure you have MySQL installed and running locally.

Create a database named todoapp.
Run the SQL script located in Database/init.sql.
2. Backend
cd backend
npm install
npm start
Server starts on port 5000.

3. Frontend
cd frontend
npm install
npm start
App starts on port 3000.

🧪 Running Tests
Unit Tests (Backend & Frontend)
We use Jest for unit testing both layers. Note: Ensure you have applied the code fixes mentioned in compliance_code.md for tests to pass.

# Install dependencies if needed
npm install jest supertest --save-dev

# Run all unit tests
npx jest _tests_/tests.js --env=jsdom
End-to-End Tests (Cypress)
We use Cypress for full E2E flows. Note: Ensure Backend (port 5000) and Frontend (port 3000) are running.

# install cypress if needed
npm install cypress --save-dev

# Open Cypress UI
npx cypress open
# Select E2E Testing > Chrome > Start
Or run headlessly:

npx cypress run --spec "_tests_/EtoE_Testing.js"
📂 Project Structure
├── backend/            # Express API
├── frontend/           # React App
├── Database/           # SQL Init scripts
├── _tests_/            # Unit & E2E Tests
└── docker-compose.yml  # Docker orchestration