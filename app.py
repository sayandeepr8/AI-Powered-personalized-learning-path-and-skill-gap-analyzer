"""
HireSense - AI-Powered Personalized Learning Path & Skill Gap Analyzer
Main application module with Flask routes and Gemini AI integration.
"""

import os
import json
import re
import time
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# PDF and DOCX parsing
import PyPDF2
from docx import Document

# Google Gemini AI
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'hiresense-secret-key-2026')

# Configure upload
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(filepath):
    """Extract text from PDF file."""
    text = ""
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text.strip()


def extract_text_from_docx(filepath):
    """Extract text from DOCX file."""
    text = ""
    try:
        doc = Document(filepath)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"DOCX extraction error: {e}")
    return text.strip()


def extract_text_from_txt(filepath):
    """Extract text from plain text file."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read().strip()
    except Exception as e:
        print(f"TXT extraction error: {e}")
        return ""


def extract_text(filepath):
    """Extract text from any supported file format."""
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'pdf':
        return extract_text_from_pdf(filepath)
    elif ext == 'docx':
        return extract_text_from_docx(filepath)
    elif ext == 'txt':
        return extract_text_from_txt(filepath)
    return ""


def analyze_with_gemini(resume_text, career_goal, skills_text=""):
    """Use Gemini AI to analyze skills and generate learning path."""
    
    if not GEMINI_API_KEY:
        return generate_fallback_analysis(resume_text, career_goal, skills_text)
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""You are an expert career counselor and educational AI mentor. Analyze the following learner profile and provide a comprehensive skill gap analysis with a personalized learning roadmap.

LEARNER PROFILE:
Resume/Academic Details:
{resume_text[:3000]}

Additional Skills Listed:
{skills_text if skills_text else 'Not provided'}

Target Career Goal/Role:
{career_goal}

Provide your analysis in the following JSON format ONLY (no markdown, no code blocks, just pure JSON):
{{
    "profile_summary": {{
        "name": "extracted name or 'Learner'",
        "current_level": "Beginner/Intermediate/Advanced",
        "education": "brief education summary",
        "experience_years": 0,
        "domain": "current domain/field"
    }},
    "skill_analysis": {{
        "strong_skills": [
            {{"name": "skill name", "level": 85, "category": "category like Programming/Design/Data/etc"}},
        ],
        "moderate_skills": [
            {{"name": "skill name", "level": 55, "category": "category"}},
        ],
        "weak_skills": [
            {{"name": "skill name", "level": 25, "category": "category"}},
        ],
        "missing_skills": [
            {{"name": "skill name", "importance": "Critical/High/Medium", "category": "category"}},
        ]
    }},
    "skill_categories": [
        {{
            "name": "Category Name (e.g., Programming, Data Science, Cloud, etc.)",
            "current_score": 65,
            "required_score": 90,
            "gap": 25
        }}
    ],
    "learning_roadmap": {{
        "phases": [
            {{
                "phase_number": 1,
                "title": "Foundation Building",
                "duration": "4-6 weeks",
                "description": "Brief description",
                "skills_to_learn": ["skill1", "skill2"],
                "resources": [
                    {{"type": "Course", "name": "Course Name", "platform": "Platform", "url": ""}},
                    {{"type": "Project", "name": "Project Name", "description": "Brief desc"}}
                ],
                "milestones": ["milestone1", "milestone2"]
            }}
        ]
    }},
    "priority_recommendations": [
        {{
            "rank": 1,
            "skill": "Skill Name",
            "reason": "Why this is priority",
            "time_estimate": "2-3 weeks",
            "difficulty": "Easy/Medium/Hard"
        }}
    ],
    "career_readiness": {{
        "overall_score": 55,
        "strengths": ["strength1", "strength2"],
        "areas_to_improve": ["area1", "area2"],
        "estimated_time_to_ready": "3-6 months",
        "market_demand": "High/Medium/Low"
    }},
    "recommended_projects": [
        {{
            "name": "Project Name",
            "description": "What to build",
            "skills_practiced": ["skill1", "skill2"],
            "difficulty": "Beginner/Intermediate/Advanced",
            "estimated_time": "2 weeks"
        }}
    ]
}}

IMPORTANT:
- Be specific and actionable in recommendations
- Provide at least 4-6 strong skills, 3-5 moderate skills, 3-5 weak skills, and 4-8 missing skills
- Create at least 3-4 learning phases in the roadmap
- Include at least 5 priority recommendations
- Provide at least 3-4 recommended projects
- Include at least 5-6 skill categories
- Make all scores realistic based on the profile
- Ensure JSON is valid and parseable
"""
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean response - remove markdown code blocks if present
        if response_text.startswith('```'):
            response_text = re.sub(r'^```(?:json)?\s*\n?', '', response_text)
            response_text = re.sub(r'\n?```\s*$', '', response_text)
        
        result = json.loads(response_text)
        return {"success": True, "data": result}
        
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print(f"Response was: {response_text[:500]}")
        return generate_fallback_analysis(resume_text, career_goal, skills_text)
    except Exception as e:
        print(f"Gemini API error: {e}")
        return generate_fallback_analysis(resume_text, career_goal, skills_text)


def generate_fallback_analysis(resume_text, career_goal, skills_text=""):
    """Generate a comprehensive analysis without API when Gemini is unavailable."""
    
    # Extract skills from text using keyword matching
    all_text = (resume_text + " " + skills_text + " " + career_goal).lower()
    
    # Comprehensive skill databases by category
    skill_db = {
        "Programming Languages": ["python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust", "php", "swift", "kotlin", "r", "scala", "perl", "matlab", "dart", "lua"],
        "Web Development": ["html", "css", "react", "angular", "vue", "node.js", "express", "django", "flask", "spring boot", "next.js", "tailwind", "bootstrap", "sass", "webpack", "graphql", "rest api"],
        "Data Science & ML": ["machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "data analysis", "nlp", "computer vision", "neural networks", "statistics", "data visualization", "tableau", "power bi", "jupyter"],
        "Cloud & DevOps": ["aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "jenkins", "terraform", "ansible", "linux", "git", "github actions", "microservices", "serverless"],
        "Database": ["sql", "mysql", "postgresql", "mongodb", "redis", "firebase", "elasticsearch", "cassandra", "oracle", "dynamodb", "neo4j"],
        "Mobile Development": ["android", "ios", "react native", "flutter", "swift", "kotlin", "xamarin"],
        "Soft Skills": ["leadership", "communication", "teamwork", "problem solving", "critical thinking", "project management", "agile", "scrum", "presentation"]
    }
    
    # Role-based required skills
    role_requirements = {
        "software engineer": {
            "required": ["python", "java", "javascript", "git", "sql", "data structures", "algorithms", "rest api", "docker", "ci/cd", "linux", "testing"],
            "nice_to_have": ["kubernetes", "aws", "microservices", "system design", "graphql"]
        },
        "data scientist": {
            "required": ["python", "machine learning", "statistics", "sql", "pandas", "numpy", "data visualization", "deep learning", "nlp", "tensorflow"],
            "nice_to_have": ["pytorch", "spark", "aws", "docker", "mlops"]
        },
        "web developer": {
            "required": ["html", "css", "javascript", "react", "node.js", "git", "rest api", "sql", "responsive design", "typescript"],
            "nice_to_have": ["next.js", "graphql", "docker", "aws", "testing"]
        },
        "frontend developer": {
            "required": ["html", "css", "javascript", "react", "typescript", "responsive design", "git", "webpack", "testing", "ui/ux"],
            "nice_to_have": ["next.js", "vue", "tailwind", "graphql", "accessibility"]
        },
        "backend developer": {
            "required": ["python", "java", "sql", "rest api", "git", "docker", "linux", "databases", "microservices", "testing"],
            "nice_to_have": ["kubernetes", "aws", "message queues", "caching", "system design"]
        },
        "machine learning engineer": {
            "required": ["python", "machine learning", "deep learning", "tensorflow", "pytorch", "statistics", "sql", "docker", "git", "mlops"],
            "nice_to_have": ["kubernetes", "aws", "spark", "nlp", "computer vision"]
        },
        "devops engineer": {
            "required": ["docker", "kubernetes", "ci/cd", "linux", "aws", "terraform", "git", "python", "monitoring", "networking"],
            "nice_to_have": ["ansible", "jenkins", "prometheus", "grafana", "security"]
        },
        "default": {
            "required": ["python", "javascript", "sql", "git", "problem solving", "communication", "data structures", "algorithms"],
            "nice_to_have": ["docker", "aws", "react", "machine learning", "agile"]
        }
    }
    
    # Find matching role
    career_lower = career_goal.lower()
    matched_role = "default"
    for role_key in role_requirements:
        if role_key in career_lower:
            matched_role = role_key
            break
    
    requirements = role_requirements[matched_role]
    
    # Detect skills in text
    found_skills = set()
    for category, skills in skill_db.items():
        for skill in skills:
            if skill.lower() in all_text:
                found_skills.add(skill)
    
    # Classify skills
    strong_skills = []
    moderate_skills = []
    weak_skills = []
    missing_skills = []
    
    for skill in found_skills:
        # Check if skill appears multiple times (indicates stronger proficiency)
        count = all_text.count(skill.lower())
        category = "General"
        for cat, skills_list in skill_db.items():
            if skill in skills_list:
                category = cat
                break
        
        if count >= 3:
            strong_skills.append({"name": skill.title(), "level": min(90, 70 + count * 5), "category": category})
        elif count >= 2:
            moderate_skills.append({"name": skill.title(), "level": min(70, 50 + count * 5), "category": category})
        else:
            weak_skills.append({"name": skill.title(), "level": 35, "category": category})
    
    # If not many skills detected, add some defaults
    if len(strong_skills) < 2:
        strong_skills.extend([
            {"name": "Communication", "level": 75, "category": "Soft Skills"},
            {"name": "Problem Solving", "level": 70, "category": "Soft Skills"},
        ])
    
    # Find missing skills from requirements
    for skill in requirements["required"]:
        if skill.lower() not in found_skills and skill.lower() not in [s["name"].lower() for s in strong_skills + moderate_skills + weak_skills]:
            missing_skills.append({"name": skill.title(), "importance": "Critical", "category": "Core"})
    
    for skill in requirements["nice_to_have"]:
        if skill.lower() not in found_skills and skill.lower() not in [s["name"].lower() for s in strong_skills + moderate_skills + weak_skills]:
            missing_skills.append({"name": skill.title(), "importance": "High", "category": "Advanced"})
    
    # Calculate category scores
    categories = {}
    for skill in strong_skills:
        cat = skill["category"]
        if cat not in categories:
            categories[cat] = {"scores": [], "required": 85}
        categories[cat]["scores"].append(skill["level"])
    
    for skill in moderate_skills:
        cat = skill["category"]
        if cat not in categories:
            categories[cat] = {"scores": [], "required": 85}
        categories[cat]["scores"].append(skill["level"])
    
    for skill in weak_skills:
        cat = skill["category"]
        if cat not in categories:
            categories[cat] = {"scores": [], "required": 85}
        categories[cat]["scores"].append(skill["level"])
    
    # Add missing categories
    for skill in missing_skills:
        cat = skill["category"]
        if cat not in categories:
            categories[cat] = {"scores": [10], "required": 85}
    
    skill_categories = []
    for cat_name, cat_data in categories.items():
        avg_score = int(sum(cat_data["scores"]) / len(cat_data["scores"])) if cat_data["scores"] else 15
        skill_categories.append({
            "name": cat_name,
            "current_score": avg_score,
            "required_score": cat_data["required"],
            "gap": max(0, cat_data["required"] - avg_score)
        })
    
    if not skill_categories:
        skill_categories = [
            {"name": "Programming", "current_score": 40, "required_score": 85, "gap": 45},
            {"name": "Frameworks", "current_score": 30, "required_score": 80, "gap": 50},
            {"name": "Tools & DevOps", "current_score": 25, "required_score": 75, "gap": 50},
            {"name": "Soft Skills", "current_score": 60, "required_score": 80, "gap": 20},
            {"name": "Domain Knowledge", "current_score": 35, "required_score": 85, "gap": 50},
        ]
    
    # Calculate overall readiness
    all_scores = [s["level"] for s in strong_skills + moderate_skills + weak_skills]
    overall = int(sum(all_scores) / len(all_scores)) if all_scores else 35
    
    result = {
        "profile_summary": {
            "name": "Learner",
            "current_level": "Beginner" if overall < 40 else "Intermediate" if overall < 70 else "Advanced",
            "education": "Extracted from profile",
            "experience_years": 0,
            "domain": career_goal
        },
        "skill_analysis": {
            "strong_skills": strong_skills[:6],
            "moderate_skills": moderate_skills[:5],
            "weak_skills": weak_skills[:5],
            "missing_skills": missing_skills[:8]
        },
        "skill_categories": skill_categories,
        "learning_roadmap": {
            "phases": [
                {
                    "phase_number": 1,
                    "title": "Foundation Building",
                    "duration": "4-6 weeks",
                    "description": f"Build core foundations required for {career_goal}",
                    "skills_to_learn": [s["name"] for s in missing_skills[:3]] if missing_skills else ["Core Concepts"],
                    "resources": [
                        {"type": "Course", "name": f"Introduction to {career_goal}", "platform": "Coursera", "url": ""},
                        {"type": "Course", "name": f"{missing_skills[0]['name'] if missing_skills else 'Core'} Fundamentals", "platform": "Udemy", "url": ""},
                        {"type": "Project", "name": "Portfolio Starter Project", "description": "Build a basic project to demonstrate fundamentals"}
                    ],
                    "milestones": ["Complete core concepts", "Build first mini-project", "Pass fundamentals assessment"]
                },
                {
                    "phase_number": 2,
                    "title": "Skill Development",
                    "duration": "6-8 weeks",
                    "description": "Develop intermediate skills and start building real projects",
                    "skills_to_learn": [s["name"] for s in missing_skills[2:5]] if len(missing_skills) > 2 else ["Advanced Concepts"],
                    "resources": [
                        {"type": "Course", "name": f"Advanced {career_goal} Skills", "platform": "Udacity", "url": ""},
                        {"type": "Project", "name": "Full-Stack Project", "description": "Build a comprehensive project using learned skills"},
                        {"type": "Course", "name": "Industry Best Practices", "platform": "LinkedIn Learning", "url": ""}
                    ],
                    "milestones": ["Complete intermediate modules", "Build 2 portfolio projects", "Contribute to open source"]
                },
                {
                    "phase_number": 3,
                    "title": "Advanced Specialization",
                    "duration": "4-6 weeks",
                    "description": "Deep dive into specialized topics and industry tools",
                    "skills_to_learn": [s["name"] for s in missing_skills[4:7]] if len(missing_skills) > 4 else ["Specialization"],
                    "resources": [
                        {"type": "Course", "name": f"Mastering {career_goal}", "platform": "Pluralsight", "url": ""},
                        {"type": "Project", "name": "Capstone Project", "description": "Industry-grade project showcasing all skills"},
                        {"type": "Course", "name": "System Design & Architecture", "platform": "educative.io", "url": ""}
                    ],
                    "milestones": ["Complete specialization", "Build capstone project", "Get peer review"]
                },
                {
                    "phase_number": 4,
                    "title": "Industry Readiness",
                    "duration": "3-4 weeks",
                    "description": "Prepare for industry with mock interviews, networking, and final polish",
                    "skills_to_learn": ["Interview Preparation", "Portfolio Building", "Networking"],
                    "resources": [
                        {"type": "Course", "name": "Technical Interview Prep", "platform": "LeetCode", "url": ""},
                        {"type": "Project", "name": "Portfolio Website", "description": "Build a professional portfolio showcasing all projects"},
                        {"type": "Course", "name": "Career Development", "platform": "LinkedIn", "url": ""}
                    ],
                    "milestones": ["Complete mock interviews", "Finalize portfolio", "Apply to positions"]
                }
            ]
        },
        "priority_recommendations": [
            {"rank": i + 1, "skill": s["name"], "reason": f"Essential for {career_goal} role", "time_estimate": "2-4 weeks", "difficulty": "Medium"}
            for i, s in enumerate(missing_skills[:5])
        ] if missing_skills else [
            {"rank": 1, "skill": "Core Programming", "reason": "Foundation skill", "time_estimate": "4 weeks", "difficulty": "Medium"}
        ],
        "career_readiness": {
            "overall_score": overall,
            "strengths": [s["name"] for s in strong_skills[:3]],
            "areas_to_improve": [s["name"] for s in missing_skills[:3]] if missing_skills else ["General Skills"],
            "estimated_time_to_ready": "3-6 months",
            "market_demand": "High"
        },
        "recommended_projects": [
            {
                "name": f"Personal {career_goal} Dashboard",
                "description": f"Build an interactive dashboard related to {career_goal}",
                "skills_practiced": [s["name"] for s in (strong_skills + moderate_skills)[:3]] or ["Programming"],
                "difficulty": "Intermediate",
                "estimated_time": "2-3 weeks"
            },
            {
                "name": "API-Driven Application",
                "description": "Create a full-stack application consuming external APIs",
                "skills_practiced": ["REST API", "Frontend", "Backend"],
                "difficulty": "Intermediate",
                "estimated_time": "2 weeks"
            },
            {
                "name": "Open Source Contribution",
                "description": "Find and contribute to an open source project in your domain",
                "skills_practiced": ["Git", "Collaboration", "Code Review"],
                "difficulty": "Intermediate",
                "estimated_time": "Ongoing"
            },
            {
                "name": f"{career_goal} Capstone Project",
                "description": f"End-to-end project demonstrating readiness for {career_goal}",
                "skills_practiced": [s["name"] for s in missing_skills[:3]] if missing_skills else ["All Skills"],
                "difficulty": "Advanced",
                "estimated_time": "4-6 weeks"
            }
        ]
    }
    
    return {"success": True, "data": result}


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Landing page."""
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze resume/skills and generate learning path."""
    try:
        career_goal = request.form.get('career_goal', '').strip()
        skills_text = request.form.get('skills_text', '').strip()
        resume_text = request.form.get('resume_text', '').strip()
        
        if not career_goal:
            return jsonify({"success": False, "error": "Please provide a career goal or target role."})
        
        # Handle file upload
        file = request.files.get('resume_file')
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_name = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
            file.save(filepath)
            
            extracted = extract_text(filepath)
            if extracted:
                resume_text = extracted
            
            # Clean up uploaded file
            try:
                os.remove(filepath)
            except:
                pass
        
        if not resume_text and not skills_text:
            return jsonify({"success": False, "error": "Please provide a resume, academic details, or skills list."})
        
        # Run AI analysis
        result = analyze_with_gemini(resume_text, career_goal, skills_text)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({"success": False, "error": f"An error occurred during analysis: {str(e)}"})


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY),
        "timestamp": datetime.now().isoformat()
    })


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("   HireSense - AI Learning Path & Skill Gap Analyzer")
    print("=" * 60)
    print(f"   Gemini API: {'[OK] Configured' if GEMINI_API_KEY else '[--] Not set (using fallback)'}")
    print(f"   Server: http://localhost:5000")
    print("=" * 60 + "\n")
    app.run(debug=True, port=5000)
