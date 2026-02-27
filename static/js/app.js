/**
 * HireSense — AI Learning Path & Skill Gap Analyzer
 * Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Initialize particles
    createParticles();
    
    // Initialize navbar scroll
    initNavbar();
    
    // Initialize form
    initForm();
    
    // Initialize file upload
    initFileUpload();
    
    // Initialize career suggestions
    initCareerSuggestions();
    
    // Animate hero stats
    animateHeroStats();
});

// ─── Particles ───────────────────────────────────────────────
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (8 + Math.random() * 12) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.width = (1 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        particle.style.opacity = 0.2 + Math.random() * 0.3;
        
        const colors = [
            'rgba(124, 58, 237, 0.5)',
            'rgba(59, 130, 246, 0.4)',
            'rgba(20, 184, 166, 0.4)',
            'rgba(168, 85, 247, 0.4)'
        ];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        container.appendChild(particle);
    }
}

// ─── Navbar ──────────────────────────────────────────────────
function initNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ─── Hero Stats Animation ────────────────────────────────────
function animateHeroStats() {
    const stats = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                const suffix = el.textContent.replace(/[0-9]/g, '');
                animateCounter(el, 0, target, 2000, suffix);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => observer.observe(stat));
}

function animateCounter(el, start, end, duration, suffix) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.round(start + (end - start) * eased);
        el.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ─── Career Suggestions ─────────────────────────────────────
function initCareerSuggestions() {
    const chips = document.querySelectorAll('.suggestion-chip');
    const input = document.getElementById('career_goal');
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            input.value = chip.dataset.value;
            input.focus();
            
            // Highlight active chip
            chips.forEach(c => c.style.borderColor = '');
            chip.style.borderColor = 'rgba(124, 58, 237, 0.5)';
            chip.style.background = 'rgba(124, 58, 237, 0.1)';
            chip.style.color = '#a855f7';
        });
    });
}

// ─── File Upload ─────────────────────────────────────────────
function initFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('resume_file');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const fileRemove = document.getElementById('fileRemove');
    
    // Drag & Drop
    ['dragenter', 'dragover'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });
    
    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });
    
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            showFilePreview(files[0].name);
        }
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            showFilePreview(fileInput.files[0].name);
        }
    });
    
    fileRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        filePreview.style.display = 'none';
    });
    
    function showFilePreview(name) {
        fileName.textContent = name;
        filePreview.style.display = 'flex';
        lucide.createIcons();
    }
}

// ─── Form Submission ─────────────────────────────────────────
function initForm() {
    const form = document.getElementById('analysisForm');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loader = analyzeBtn.querySelector('.btn-loader');
    const btnContent = analyzeBtn.querySelector('span');
    const btnIcon = analyzeBtn.querySelector('i');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate
        const careerGoal = document.getElementById('career_goal').value.trim();
        const skillsText = document.getElementById('skills_text').value.trim();
        const resumeText = document.getElementById('resume_text').value.trim();
        const fileInput = document.getElementById('resume_file');
        
        if (!careerGoal) {
            showToast('Please enter your target career or role.', 'error');
            return;
        }
        
        if (!skillsText && !resumeText && (!fileInput.files || fileInput.files.length === 0)) {
            showToast('Please provide your resume, skills, or upload a file.', 'error');
            return;
        }
        
        // Show loading
        analyzeBtn.disabled = true;
        loader.style.display = 'flex';
        btnContent.style.opacity = 0;
        btnIcon.style.opacity = 0;
        
        showLoadingOverlay();
        
        // Prepare FormData
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                await completeLoading();
                renderResults(result.data);
                showToast('Analysis complete! Scroll down to view your results.', 'success');
            } else {
                hideLoadingOverlay();
                showToast(result.error || 'Analysis failed. Please try again.', 'error');
            }
        } catch (error) {
            hideLoadingOverlay();
            showToast('Network error. Please check your connection and try again.', 'error');
            console.error('Fetch error:', error);
        } finally {
            analyzeBtn.disabled = false;
            loader.style.display = 'none';
            btnContent.style.opacity = 1;
            btnIcon.style.opacity = 1;
        }
    });
    
    // New Analysis button
    document.getElementById('newAnalysisBtn').addEventListener('click', () => {
        document.getElementById('results').style.display = 'none';
        document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' });
    });
}

// ─── Loading Overlay ─────────────────────────────────────────
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';
    lucide.createIcons();
    
    // Animate steps
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const progressBar = document.getElementById('loadingProgress');
    
    // Reset
    steps.forEach(id => {
        const step = document.getElementById(id);
        step.className = 'loading-step';
    });
    document.getElementById('step1').classList.add('active');
    progressBar.style.width = '5%';
    
    // Animate through steps
    setTimeout(() => {
        document.getElementById('step1').classList.replace('active', 'done');
        document.getElementById('step2').classList.add('active');
        progressBar.style.width = '30%';
    }, 1200);
    
    setTimeout(() => {
        document.getElementById('step2').classList.replace('active', 'done');
        document.getElementById('step3').classList.add('active');
        progressBar.style.width = '55%';
    }, 2400);
    
    setTimeout(() => {
        document.getElementById('step3').classList.replace('active', 'done');
        document.getElementById('step4').classList.add('active');
        progressBar.style.width = '80%';
    }, 3600);
}

function completeLoading() {
    return new Promise(resolve => {
        const progressBar = document.getElementById('loadingProgress');
        document.getElementById('step4').classList.replace('active', 'done');
        progressBar.style.width = '100%';
        
        setTimeout(() => {
            hideLoadingOverlay();
            resolve();
        }, 600);
    });
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}

// ─── Toast Notifications ─────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconName = type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle-2' : 'info';
    toast.innerHTML = `<i data-lucide="${iconName}"></i><span>${message}</span>`;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(60px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ─── Render Results ──────────────────────────────────────────
function renderResults(data) {
    const resultsSection = document.getElementById('results');
    
    // Update subtitle
    const profile = data.profile_summary || {};
    document.getElementById('resultsSubtitle').textContent = 
        `Analysis for ${profile.name || 'Learner'} — Targeting: ${profile.domain || 'Career Goal'}`;
    
    // Render all sections
    renderReadinessScore(data);
    renderSkillRadar(data);
    renderSkillGapChart(data);
    renderSkillBreakdown(data);
    renderRoadmap(data);
    renderPriorityList(data);
    renderProjects(data);
    
    // Show results
    resultsSection.style.display = 'block';
    
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Refresh icons
    lucide.createIcons();
}

// ─── Readiness Score Gauge ───────────────────────────────────
function renderReadinessScore(data) {
    const readiness = data.career_readiness || {};
    const score = readiness.overall_score || 0;
    
    // Animate score number
    const scoreEl = document.getElementById('readinessScore');
    animateCounter(scoreEl, 0, score, 1500, '');
    
    // Draw gauge
    const canvas = document.getElementById('readinessGauge');
    const ctx = canvas.getContext('2d');
    const size = 220;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 90;
    const lineWidth = 12;
    
    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Animated fill arc
    const endAngle = 0.75 * Math.PI + (score / 100) * 1.5 * Math.PI;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    if (score >= 70) {
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#34d399');
    } else if (score >= 40) {
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#fbbf24');
    } else {
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(1, '#f87171');
    }
    
    // Animate the arc
    let currentAngle = 0.75 * Math.PI;
    const targetAngle = endAngle;
    const duration = 1200;
    const startTime = performance.now();
    
    function drawArc(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        currentAngle = 0.75 * Math.PI + eased * (targetAngle - 0.75 * Math.PI);
        
        ctx.clearRect(0, 0, size, size);
        
        // Background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Fill
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, currentAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Glow effect
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, currentAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth + 6;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.15;
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        if (progress < 1) {
            requestAnimationFrame(drawArc);
        }
    }
    
    requestAnimationFrame(drawArc);
    
    // Meta info
    document.getElementById('timeToReady').textContent = readiness.estimated_time_to_ready || '3-6 months';
    document.getElementById('marketDemand').textContent = readiness.market_demand || 'High';
    document.getElementById('currentLevel').textContent = (data.profile_summary || {}).current_level || 'Intermediate';
    
    // Strength tags
    const strengthTags = document.getElementById('strengthTags');
    strengthTags.innerHTML = (readiness.strengths || [])
        .map(s => `<span class="tag tag-green">${s}</span>`).join('');
    
    // Improve tags
    const improveTags = document.getElementById('improveTags');
    improveTags.innerHTML = (readiness.areas_to_improve || [])
        .map(s => `<span class="tag tag-amber">${s}</span>`).join('');
}

// ─── Skill Radar Chart ──────────────────────────────────────
function renderSkillRadar(data) {
    const categories = data.skill_categories || [];
    const canvas = document.getElementById('skillRadarChart');
    
    // Destroy previous chart if exists
    if (canvas._chart) canvas._chart.destroy();
    
    const chart = new Chart(canvas, {
        type: 'radar',
        data: {
            labels: categories.map(c => c.name),
            datasets: [
                {
                    label: 'Current Level',
                    data: categories.map(c => c.current_score),
                    backgroundColor: 'rgba(124, 58, 237, 0.15)',
                    borderColor: '#7c3aed',
                    borderWidth: 2,
                    pointBackgroundColor: '#7c3aed',
                    pointBorderColor: '#7c3aed',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Required Level',
                    data: categories.map(c => c.required_score),
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderColor: 'rgba(59, 130, 246, 0.4)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#3b82f6',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#a0a0b8',
                        font: { family: 'Inter', size: 12, weight: 500 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        color: '#45455a',
                        backdropColor: 'transparent',
                        font: { size: 10 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    pointLabels: {
                        color: '#a0a0b8',
                        font: { family: 'Inter', size: 11, weight: 500 }
                    }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });
    
    canvas._chart = chart;
}

// ─── Skill Gap Bar Chart ─────────────────────────────────────
function renderSkillGapChart(data) {
    const categories = data.skill_categories || [];
    const canvas = document.getElementById('gapBarChart');
    
    if (canvas._chart) canvas._chart.destroy();
    
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: categories.map(c => c.name),
            datasets: [
                {
                    label: 'Current',
                    data: categories.map(c => c.current_score),
                    backgroundColor: 'rgba(124, 58, 237, 0.7)',
                    borderColor: '#7c3aed',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                },
                {
                    label: 'Gap to Fill',
                    data: categories.map(c => c.gap),
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#a0a0b8',
                        font: { family: 'Inter', size: 12, weight: 500 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'rectRounded'
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                        color: '#a0a0b8',
                        font: { family: 'Inter', size: 11 },
                        maxRotation: 45
                    },
                    border: { display: false }
                },
                y: {
                    stacked: true,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        color: '#6b6b80',
                        font: { size: 10 },
                        stepSize: 20
                    },
                    border: { display: false }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });
    
    canvas._chart = chart;
}

// ─── Skill Breakdown ─────────────────────────────────────────
function renderSkillBreakdown(data) {
    const skills = data.skill_analysis || {};
    
    // Strong
    renderSkillColumn('strongSkills', skills.strong_skills || [], 'green');
    
    // Moderate
    renderSkillColumn('moderateSkills', skills.moderate_skills || [], 'amber');
    
    // Weak
    renderSkillColumn('weakSkills', skills.weak_skills || [], 'rose');
    
    // Missing
    renderMissingSkills('missingSkills', skills.missing_skills || []);
}

function renderSkillColumn(containerId, skills, colorClass) {
    const container = document.getElementById(containerId);
    
    if (skills.length === 0) {
        container.innerHTML = '<div style="padding: 16px; color: var(--text-dim); font-size: 0.82rem;">No skills in this category</div>';
        return;
    }
    
    container.innerHTML = skills.map(skill => `
        <div class="skill-item">
            <div class="skill-item-header">
                <span class="skill-name">${skill.name}</span>
                <span class="skill-level" style="color: var(--${colorClass === 'green' ? 'green' : colorClass === 'amber' ? 'amber' : 'rose'})">${skill.level}%</span>
            </div>
            <div class="skill-bar">
                <div class="skill-bar-fill ${colorClass}" data-width="${skill.level}"></div>
            </div>
            <div class="skill-category">${skill.category || ''}</div>
        </div>
    `).join('');
    
    // Animate bars
    setTimeout(() => {
        container.querySelectorAll('.skill-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
        });
    }, 300);
}

function renderMissingSkills(containerId, skills) {
    const container = document.getElementById(containerId);
    
    if (skills.length === 0) {
        container.innerHTML = '<div style="padding: 16px; color: var(--text-dim); font-size: 0.82rem;">No missing skills detected</div>';
        return;
    }
    
    container.innerHTML = skills.map(skill => {
        const impClass = (skill.importance || '').toLowerCase();
        return `
            <div class="skill-item">
                <div class="skill-item-header">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-importance importance-${impClass}">${skill.importance || 'High'}</span>
                </div>
                <div class="skill-category">${skill.category || ''}</div>
            </div>
        `;
    }).join('');
}

// ─── Roadmap Timeline ────────────────────────────────────────
function renderRoadmap(data) {
    const roadmap = data.learning_roadmap || {};
    const phases = roadmap.phases || [];
    const container = document.getElementById('roadmapTimeline');
    
    container.innerHTML = phases.map(phase => `
        <div class="phase-card" style="animation: fadeInUp 0.5s ease ${(phase.phase_number - 1) * 0.15}s both;">
            <div class="phase-dot"></div>
            <div class="phase-header">
                <span class="phase-number">Phase ${phase.phase_number}</span>
                <span class="phase-title">${phase.title}</span>
                <span class="phase-duration"><i data-lucide="clock" style="width:12px;height:12px;display:inline;vertical-align:middle;margin-right:4px;"></i>${phase.duration}</span>
            </div>
            <p class="phase-desc">${phase.description}</p>
            
            <div class="phase-skills">
                ${(phase.skills_to_learn || []).map(s => `<span class="phase-skill-tag">${s}</span>`).join('')}
            </div>
            
            <div class="phase-resources">
                ${(phase.resources || []).map(r => `
                    <div class="resource-item">
                        <span class="resource-type ${(r.type || '').toLowerCase()}">${r.type || 'Resource'}</span>
                        <div>
                            <div class="resource-name">${r.name}</div>
                            ${r.platform ? `<div class="resource-platform">${r.platform}</div>` : ''}
                            ${r.description ? `<div class="resource-platform">${r.description}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="phase-milestones">
                ${(phase.milestones || []).map(m => `
                    <span class="milestone-item"><i data-lucide="check-circle-2"></i>${m}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// ─── Priority Recommendations ────────────────────────────────
function renderPriorityList(data) {
    const priorities = data.priority_recommendations || [];
    const container = document.getElementById('priorityList');
    
    container.innerHTML = priorities.map(p => {
        const diffClass = (p.difficulty || '').toLowerCase();
        return `
            <div class="priority-item" style="animation: fadeInUp 0.4s ease ${(p.rank - 1) * 0.1}s both;">
                <div class="priority-rank">${p.rank}</div>
                <div class="priority-info">
                    <div class="priority-skill">${p.skill}</div>
                    <div class="priority-reason">${p.reason}</div>
                </div>
                <div class="priority-meta">
                    <span class="priority-badge badge-time"><i data-lucide="clock" style="width:10px;height:10px;display:inline;vertical-align:middle;margin-right:3px;"></i>${p.time_estimate}</span>
                    <span class="priority-badge badge-${diffClass}">${p.difficulty}</span>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

// ─── Recommended Projects ────────────────────────────────────
function renderProjects(data) {
    const projects = data.recommended_projects || [];
    const container = document.getElementById('projectsGrid');
    
    container.innerHTML = projects.map(project => {
        const diffClass = (project.difficulty || '').toLowerCase();
        return `
            <div class="project-card" style="animation: fadeInUp 0.5s ease 0.1s both;">
                <span class="project-difficulty diff-${diffClass}">${project.difficulty}</span>
                <h4 class="project-name">${project.name}</h4>
                <p class="project-desc">${project.description}</p>
                <div class="project-skills">
                    ${(project.skills_practiced || []).map(s => `<span class="project-skill-tag">${s}</span>`).join('')}
                </div>
                <div class="project-time">
                    <i data-lucide="clock"></i>
                    <span>${project.estimated_time}</span>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}
