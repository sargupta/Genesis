# Portable User Persona Demo

This is a demo implementation of a platform for building and managing portable user personas, as described in the business plan.

## Features
- User registration and login
- Persona building (writing sample, image preference, behavioral tracking)
- Persona dashboard (view/export persona)
- Privacy controls
- API endpoint for persona export

## Tech Stack
- Backend: Python (Flask, SQLAlchemy, Hugging Face Transformers)
- Frontend: React
- Database: SQLite (for demo)

## Setup Instructions

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional) Create a virtual environment and activate it.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Flask app:
   ```bash
   python app.py
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Initialize a React app (if not already present):
   ```bash
   npx create-react-app .
   ```
3. Start the React app:
   ```bash
   npm start
   ```

---

This demo is for illustrative purposes and can be extended for production use.
