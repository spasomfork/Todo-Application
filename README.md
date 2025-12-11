# Todo Application
A full-stack Todo application built with **React**, **Node.js (Express)**, and **MySQL**.

## 🚀 Features
- **Create Task**: Add new tasks with title and description.
- **View Tasks**: See the 5 most recent active tasks.
- **Complete Task**: Mark tasks as done (removes them from the active list).
- **Responsive UI**: Built with Tailwind CSS and Framer Motion.

## 🛠 Tech Stack
- **Frontend**: React, Tailwind CSS, Axios
- **Backend**: Node.js, Express, MySQL2
- **Database**: MySQL 8.0
- **Testing**: Jest, Supertest, React Testing Library, Cypress

## 🏁 Quick Start (Docker)
The easiest way to run the entire application is using Docker.

**Prerequisites:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop).

### Run
```bash
docker-compose up --build
```

### Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **PhpMyAdmin**: http://localhost:8080 (User: `root`, Password: `root`)

---

## 💻 Local Setup (Without Docker)

### Database Setup
1. Ensure you have MySQL installed and running locally.
2. Create a database named `todoapp`.
3. Run the SQL script located in `Database/init.sql`.

### Backend
```bash
cd backend
npm install
npm start
```
*Server starts on port 5000.*

### Frontend
```bash
cd frontend
npm install
npm start
```
*App starts on port 3000.*

---

## 🧪 Running Tests

### Unit Tests (Backend & Frontend)
Since the application runs in Docker, you can run the tests directly inside the containers without installing Node.js locally.

**Prerequisites:** Ensure Docker containers are running:
```bash
docker-compose up -d
```

#### Backend Unit Tests
Runs the Node.js/Express API tests (located in `tests/backend.test.js`).

```bash
docker exec todo_backend npx jest tests/backend.test.js
```

#### Frontend Unit Tests
Runs the React component tests (located in `tests/frontend.test.js`).

```bash
docker exec -e CI=true todo_frontend npm test -- src/tests/frontend.test.js
```

**Expected Output:** You should see a series of green checks (✓) and a summary like:
```text
PASS tests/backend.test.js
  🟦 BACKEND API TESTS
    ✓ POST /tasks → creates task (201)
    ✓ GET /tasks → returns only 5 newest
    ...

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

**Notes:**
- Backend tests use `supertest` to simulate HTTP requests.
- Frontend tests use `@testing-library/react` and Jest to simulate user interactions.

---

### End-to-End Tests (Cypress)
We use Cypress for full E2E flows. **Note:** Ensure Backend (port 5000) and Frontend (port 3000) are running.

#### 1. Install Cypress (if needed)
```bash
npm install cypress --save-dev
```

#### 2. Open Cypress UI
```bash
npx cypress open
```
Select **E2E Testing** > **Chrome** > **Start**.

**Or run headlessly:**
```bash
npx cypress run --spec "_tests_/EtoE_Testing.js"
```

---

## 📂 Project Structure
```
├── backend/            # Express API
├── frontend/           # React App
├── Database/           # SQL Init scripts
├── _tests_/            # E2E Tests
└── docker-compose.yml  # Docker orchestration
```
