# 📊 Job Search Monitor

A private, powerful, and aesthetically premium local web application designed to streamline your job search process. Track vacancies, monitor your application status with a robust Kanban board, and gain deep insights through built-in analytics—all without your data leaving your computer.

## ✨ Features

### 🏢 Vacancy Management
*   **Kanban Board**: Intuitively manage your pipeline with drag-and-drop functionality across stages (New, Applied, Response, Interview, Offer, Rejected).
*   **Smart Interactions**: Optimized "Smart Scrolling" for handling large lists and horizontal board navigation simultaneously.
*   **Visual Feedback**: Vacancy cards feature dynamic color coding and glow effects based on their stage for immediate visual recognition.
*   **Detailed Tracking**: Store comprehensive info including salary range, work format (Remote/Hybrid), contacts, and direct links.
*   **History & Notes**: Every action is logged automatically. Add persistent notes and comments to any vacancy on the fly.

### 📈 Analytics & Dashboard
*   **Live Overview Dashboard**:
    *   **KPI Cards**: Instant visibility into Active Pipeline, Response Rates, and Interview Conversion.
    *   **Application Funnel**: Interactive visualization of your progress from Application to Offer.
    *   **Needs Attention**: Automatically flags "stale" vacancies (no updates in 7 days) to keep your search momentum high.
*   **Advanced Analytics**: Detailed breakdown of monthly activities, weekly momentum, and success ratios.
*   **export Capabilities**:
    *   **PDF Reports**: Generate professional, formatted status reports (supported in **English** and **German**).
    *   **CSV Export**: Download raw data for your own spreadsheet magic.

### 🎨 UI & UX
*   **Premium Design**: Built with a focus on aesthetics using Glassmorphism in Dark Mode and a clean, crisp interface in Light Mode.
*   **Responsive Layout**: Collapsible sidebar, adaptive grids, and smooth transitions.
*   **Search**: Instant filtering by company name, position, or location.

### 🔒 Privacy First
*   **Local Storage**: All data is stored in local CSV files (`data/vacancies.csv`, `data/events.csv`). Nothing is uploaded to the cloud.

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
*   **Backend**: Python, FastAPI
*   **Data Processing**: Pandas (for robust CSV handling and analytics)
*   **PDF Generation**: jsPDF + html2canvas

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [Python](https://www.python.org/) (v3.8 or higher)

### 1. Setup Backend (Python)

Open a terminal in the root directory:

```bash
# Create a virtual environment (optional but recommended)
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn backend.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Setup Frontend (React)

Open a **new** terminal window and navigate to the `frontend` folder:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will open at `http://localhost:5173`.

## 📂 Project Structure

```
├── backend/            # FastAPI application
│   ├── main.py         # API Entry point & Routes
│   ├── models.py       # Pydantic data schemas
│   ├── storage.py      # CSV CRUD operations
│   └── analytics.py    # Data processing & Report logic
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Dashboard, Kanban, Modals, Reports
│   │   ├── contexts/   # Global state (Theme, Settings)
│   │   ├── services/   # API Client
│   │   └── types/      # TypeScript interfaces
├── data/               # 🔒 Local storage (git-ignored)
│   ├── vacancies.csv
│   └── events.csv
└── requirements.txt    # Python dependencies
```

## 🛡️ Data Privacy

This project is configured to **ignore** the `data/` directory in Git. This means you can safely push the code to GitHub without exposing your personal job search history.
