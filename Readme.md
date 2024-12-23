
# Mentorship Matching Platform

This project is a Mentorship Matching Platform built using Node.js and MySQL for the backend and HTML, JavaScript, and CSS for the frontend.

---

## Technologies Used

- **Backend**: Node.js, Express.js, MySQL.
- **Frontend**: HTML, CSS, JavaScript.
- **Database**: MySQL.
- **Other Tools**: Git, dotenv.

---

## Prerequisites

Before setting up the platform, ensure you have the following installed on your system:

- Node.js (v14 or above)
- MySQL (v5.7 or above)
- Git

---

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Devanshi-Bilthare/mentorship-matching-platform
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up the database**:
   - Open your MySQL server.
   - Create a database

4. **Configure environment variables**:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     DB_HOST=localhost
     DB_USER=<your_mysql_username>
     DB_PASSWORD=<your_mysql_password>
     DB_NAME=mentorship_platform
     PORT=3000
     ```

5. **Start the server**:
   ```bash
   node index.js
   ```

6. **Open the frontend**:
   - Open the `http://localhost:3000/index.html` file in your browser.
