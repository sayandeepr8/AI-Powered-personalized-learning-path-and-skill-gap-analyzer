# 🧠 HireSense — AI-Powered Personalized Learning Path & Skill Gap Analyzer

> Transform your resume into an intelligent learning roadmap. Our AI analyzes your skills, identifies gaps, and creates a personalized path to make you industry-ready.

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 🎯 **Skill Gap Detection** | Identifies exactly what skills you need to learn |
| 🧠 **Personalized Learning Path** | Adaptive roadmap based on goals and current level |
| 📊 **Visual Analytics** | Beautiful charts showing your skill landscape |
| 💡 **Smart Recommendations** | AI-curated courses, projects, and resources |
| 📈 **Career Readiness Score** | Instant assessment of your readiness for target roles |
| 📄 **Resume Analysis** | Upload PDF, DOCX, or text — NLP extracts and categorizes skills |

## ⚙️ How It Works

1. **Upload Your Profile** — Share your resume, academic details, or list your skills
2. **AI Analyzes** — Gemini AI extracts skills, compares with industry standards, identifies gaps
3. **Get Your Roadmap** — Receive a personalized learning path with courses, projects, and milestones

## 🛠️ Tech Stack

- **Backend:** Python / Flask
- **AI Engine:** Google Gemini 2.0 Flash
- **Frontend:** HTML5, CSS3, JavaScript
- **Charts:** Chart.js
- **Icons:** Lucide Icons
- **File Parsing:** PyPDF2, python-docx

## 📦 Setup & Installation

### 1. Clone the repository
```bash
cd HireSense
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure API Key
Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) and add it to `.env`:
```env
GEMINI_API_KEY=your_api_key_here
```

> **Note:** The app works without an API key using a smart fallback engine, but Gemini AI provides much more detailed and accurate analysis.

### 4. Run the application
```bash
python app.py
```

### 5. Open in browser
Navigate to `http://localhost:5000`

## 📸 Output Includes

- **Career Readiness Score** — Animated gauge with overall readiness percentage
- **Skill Radar Chart** — Current vs required skills across categories
- **Skill Gap Bar Chart** — Visual gap analysis per category
- **Detailed Skill Breakdown** — Strong, moderate, weak, and missing skills
- **Learning Roadmap** — Phase-by-phase timeline with resources and milestones
- **Priority Recommendations** — Ranked list of what to learn first
- **Recommended Projects** — Hands-on projects to practice skills

## 🎓 Educational Impact

- Empowers students with clarity and direction
- Supports outcome-based education
- Bridges the gap between academia and industry
- Reduces dependency on trial-and-error learning

## 📈 Future Scope

- Integration with college LMS platforms
- Course and certification recommendations with direct links
- Learning progress tracking dashboard
- AI mentor chatbot for continuous guidance
- Institution-level skill analytics

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ using Gemini AI**
