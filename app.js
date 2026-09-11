/* ==========================================
   BIOSPARK MVP APPLICATION LOGIC (app.js)
   100% Client-side Parsing, Indexing & AI
   ========================================== */

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// --- GLOBAL APPLICATION STATE ---
let state = {
    apiKey: localStorage.getItem('biospark_gemini_key') || '',
    candidates: [],
    selectedCandidateId: null,
    currentView: 'recruiter', // 'recruiter' | 'jobseeker'
    isRecording: false,
    isSpeaking: false,
    speechSynthesisUtterance: null,
    // Preseeded candidates for simulated demo mode
    mockCandidates: [
        {
            id: 'c1',
            name: 'Malik Al-Raji',
            title: 'Senior Full Stack Engineer',
            location: 'Amman, Jordan (Open to Hybrid/Remote)',
            email: 'malik.raji@email.com',
            phone: '+962 7 9123 4567',
            linkedin: 'linkedin.com/in/malik-raji',
            skills: ['Node.js', 'React', 'AWS (EC2/S3/Lambda)', 'PostgreSQL', 'Docker', 'GraphQL'],
            experience: '6 Years (Fintech, SaaS platforms)',
            status: 'available', // 'available' | 'hired'
            unlocked: false,
            updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
            experienceTimeline: [
                { role: 'Senior Engineer', company: 'Liwwa Fintech', date: '2024 - Present', desc: 'Led development of peer-to-peer lending backend microservices. Saved 35% on cloud compute through AWS optimizations.' },
                { role: 'Software Developer', company: 'Mawdoo3', date: '2020 - 2024', desc: 'Developed high-traffic web apps utilizing React.js and Node.js. Maintained search indices servicing millions of visitors.' }
            ],
            pitch: "Hey there! I'm Malik, a full-stack engineer who loves scaling web applications and optimizing AWS infrastructure. I'm currently looking for new opportunities in Jordan or remote. Ask my AI clone anything, or listen to my audio answers!",
            inquiries: [
                { id: 'inq1', question: 'Do you have experience managing production AWS deployments?', audioUrl: 'mock' }
            ]
        },
        {
            id: 'c2',
            name: 'Sarah Kanaan',
            title: 'Lead UI/UX Designer',
            location: 'Amman, Jordan (Local Only)',
            email: 'sarah.kanaan@design.io',
            phone: '+962 7 8987 6543',
            linkedin: 'linkedin.com/in/sarah-kanaan-design',
            skills: ['Figma', 'Design Systems', 'Interactive Mockups', 'Adobe Creative Suite', 'User Research', 'HTML/CSS'],
            experience: '4 Years (E-commerce, Mobile apps)',
            status: 'available',
            unlocked: false,
            updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h ago
            experienceTimeline: [
                { role: 'UI/UX Designer', company: 'OpenSooq', date: '2022 - Present', desc: 'Re-designed search filter funnels, boosting conversion rate by 18%. Crafted mobile and tablet design systems.' },
                { role: 'Junior Designer', company: 'BrandStudio Jordan', date: '2020 - 2022', desc: 'Created brand guidelines, graphic layouts, and responsive landing pages for local startup clients.' }
            ],
            pitch: "Hello! I am Sarah. I focus on creating clean, intuitive interfaces that solve user friction. I believe beautiful design should drive metrics. Feel free to review my Figma layouts or ask my AI clone questions.",
            inquiries: []
        },
        {
            id: 'c3',
            name: 'Tariq Mansour',
            title: 'Product Manager',
            location: 'Dubai, UAE (Open to relocation)',
            email: 'tariq.mansour@product.com',
            phone: '+971 50 123 4567',
            linkedin: 'linkedin.com/in/tariq-mansour-pm',
            skills: ['Product Roadmap', 'Agile/Scrum', 'Mixpanel Analytics', 'User Story Mapping', 'SQL', 'Customer Interviews'],
            experience: '5 Years (B2B SaaS, Analytics)',
            status: 'hired',
            unlocked: false,
            updatedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10h ago
            experienceTimeline: [
                { role: 'Product Lead', company: 'Tamara Tech', date: '2023 - Present', desc: 'Owned checkout experience integrations. Shipped dynamic checkout options, growing average order value by 12%.' },
                { role: 'Associate PM', company: 'Aramex HQ', date: '2021 - 2023', desc: 'Managed feature requirements and engineering backlogs for internal tracking applications.' }
            ],
            pitch: "Hi recruiters! I'm Tariq, a product manager specializing in B2B user engagement analytics. I translate customer friction into clear engineering sprints. I just landed a new position, so I am not currently looking, but feel free to browse my portfolio.",
            inquiries: []
        }
    ]
};

// Initialize State
state.candidates = [...state.mockCandidates];

// --- SELECTORS ---
const dom = {
    landingWorkspace: document.getElementById('landing-workspace'),
    recruiterWorkspace: document.getElementById('recruiter-workspace'),
    jobseekerWorkspace: document.getElementById('jobseeker-workspace'),
    viewLanding: document.getElementById('view-landing'),
    viewRecruiter: document.getElementById('view-recruiter'),
    viewJobseeker: document.getElementById('view-jobseeker'),
    btnSettings: document.getElementById('btn-settings'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    btnCancelSettings: document.getElementById('btn-cancel-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    apiKeyInput: document.getElementById('api-key-input'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    progressContainer: document.getElementById('upload-progress-container'),
    progressText: document.getElementById('progress-text'),
    progressFill: document.getElementById('progress-fill'),
    progressPercentage: document.getElementById('progress-percentage'),
    candidatesContainer: document.getElementById('candidates-container'),
    resumePlaceholder: document.getElementById('resume-viewer-placeholder'),
    resumeTextContent: document.getElementById('resume-text-content'),
    previewActions: document.getElementById('preview-actions'),
    chatHistory: document.getElementById('chat-history-container'),
    chatInput: document.getElementById('chat-input'),
    btnSendChat: document.getElementById('btn-send-chat'),
    btnSimilar: document.getElementById('btn-similar'),
    voiceWidget: document.getElementById('voice-verify-widget'),
    avatarAudioIndicator: document.getElementById('avatar-audio-indicator'),
    btnListenPitch: document.getElementById('btn-listen-pitch'),
    btnRecordInquiry: document.getElementById('btn-record-inquiry'),
    contactLockOverlay: document.getElementById('contact-lock-overlay'),
    btnUnlockContact: document.getElementById('btn-unlock-contact'),
    contactInfoPanel: document.getElementById('contact-info-panel'),
    candidateEmail: document.getElementById('candidate-email'),
    candidatePhone: document.getElementById('candidate-phone'),
    candidateLinkedin: document.getElementById('candidate-linkedin'),
    btnStatusAvailable: document.getElementById('btn-status-available'),
    btnStatusHired: document.getElementById('btn-status-hired'),
    statusHelperText: document.getElementById('status-helper-text'),
    seekerUploadZone: document.getElementById('seeker-upload-zone'),
    seekerFileInput: document.getElementById('seeker-file-input'),
    poolSearch: document.getElementById('pool-search'),
    btnAiSearch: document.getElementById('btn-ai-search'),
    filterAll: document.getElementById('filter-all'),
    filterActive: document.getElementById('filter-active'),
    filterUnlocked: document.getElementById('filter-unlocked'),
    themeSelect: document.getElementById('theme-select'),
    btnPostJob: document.getElementById('btn-post-job'),
    jobModal: document.getElementById('job-modal'),
    closeJobModal: document.getElementById('close-job-modal'),
    btnCancelJob: document.getElementById('btn-cancel-job'),
    btnSaveJob: document.getElementById('btn-save-job'),
    jobTitleInput: document.getElementById('job-title-input'),
    jobLocationInput: document.getElementById('job-location-input'),
    jobSalaryInput: document.getElementById('job-salary-input'),
    jobRequirementsInput: document.getElementById('job-requirements-input'),
    activeJobTitleDisplay: document.getElementById('active-job-title'),
    activeJobDetailsDisplay: document.getElementById('active-job-details'),
    seekerMatchTitle: document.getElementById('seeker-match-title'),
    seekerMatchSalary: document.getElementById('seeker-match-salary'),
    seekerMatchMeta: document.getElementById('seeker-match-meta')
};

// --- INIT APP ---
window.addEventListener('DOMContentLoaded', () => {
    // Load local storage Gemini key
    if (state.apiKey) {
        dom.apiKeyInput.value = state.apiKey;
    }

    // Load saved visual theme
    const savedTheme = localStorage.getItem('biospark_theme') || 'theme-cyan-purple';
    document.body.className = '';
    document.body.classList.add(savedTheme);
    dom.themeSelect.value = savedTheme;

    renderCandidates();
    initSettingsModal();
    initDragAndDrop();
    initChatLogic();
    initVoiceSynthesis();
    initJobSeekerControls();
    initFilters();
    initJobModal();
    
    // Set initial view (defaults to landing page)
    const initialView = localStorage.getItem('biospark_last_view') || 'landing';
    switchView(initialView);
});

// --- ROUTING / VIEW SWITCHING ---
function switchView(target) {
    state.currentView = target;
    localStorage.setItem('biospark_last_view', target);
    
    // Stop speaking if switching views
    stopSpeaking();

    // Toggle icons and text in mobile bottom nav
    const recIcons = document.querySelectorAll('.mobile-tab-icon-recruiter');
    const seekerIcons = document.querySelectorAll('.mobile-tab-icon-seeker');
    const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
    
    if (target === 'landing') {
        if (dom.viewLanding) dom.viewLanding.classList.add('active');
        dom.viewRecruiter.classList.remove('active');
        dom.viewJobseeker.classList.remove('active');
        if (dom.landingWorkspace) dom.landingWorkspace.style.display = 'block';
        dom.recruiterWorkspace.style.display = 'none';
        dom.jobseekerWorkspace.style.display = 'none';
        if (mobileBottomNav) mobileBottomNav.style.display = 'none';
    } else if (target === 'recruiter') {
        if (dom.viewLanding) dom.viewLanding.classList.remove('active');
        dom.viewRecruiter.classList.add('active');
        dom.viewJobseeker.classList.remove('active');
        if (dom.landingWorkspace) dom.landingWorkspace.style.display = 'none';
        dom.recruiterWorkspace.style.display = 'grid';
        dom.jobseekerWorkspace.style.display = 'none';
        if (mobileBottomNav) mobileBottomNav.style.display = 'flex';
        renderCandidates();

        // Mobile Nav UI Adjustments
        recIcons.forEach(el => el.style.display = 'inline-block');
        seekerIcons.forEach(el => el.style.display = 'none');
        document.getElementById('mob-tab-text-1').textContent = 'Pool';
        document.getElementById('mob-tab-text-2').textContent = 'Resume';
        document.getElementById('mob-tab-text-3').textContent = 'Co-Pilot';
        switchMobileTab(1);
    } else {
        if (dom.viewLanding) dom.viewLanding.classList.remove('active');
        dom.viewRecruiter.classList.remove('active');
        dom.viewJobseeker.classList.add('active');
        if (dom.landingWorkspace) dom.landingWorkspace.style.display = 'none';
        dom.recruiterWorkspace.style.display = 'none';
        dom.jobseekerWorkspace.style.display = 'grid';
        if (mobileBottomNav) mobileBottomNav.style.display = 'flex';
        loadJobSeekerConfig();

        // Mobile Nav UI Adjustments
        recIcons.forEach(el => el.style.display = 'none');
        seekerIcons.forEach(el => el.style.display = 'inline-block');
        document.getElementById('mob-tab-text-1').textContent = 'Dashboard';
        document.getElementById('mob-tab-text-2').textContent = 'Optimize';
        document.getElementById('mob-tab-text-3').textContent = 'Activity';
        switchMobileTab(1);
    }
}

// --- SETTINGS MODAL ---
function initSettingsModal() {
    dom.btnSettings.addEventListener('click', () => {
        dom.settingsModal.classList.add('open');
    });

    const closeModal = () => dom.settingsModal.classList.remove('open');

    dom.closeSettings.addEventListener('click', closeModal);
    dom.btnCancelSettings.addEventListener('click', closeModal);
    
    dom.btnSaveSettings.addEventListener('click', () => {
        const key = dom.apiKeyInput.value.trim();
        state.apiKey = key;
        localStorage.setItem('biospark_gemini_key', key);
        closeModal();
        addAiMessage(`System: Gemini API Key has been updated. Running in live mode.`);
    });

    // Color Scheme Selector (Instant real-time theme swapping)
    dom.themeSelect.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        document.body.className = '';
        document.body.classList.add(selectedTheme);
        localStorage.setItem('biospark_theme', selectedTheme);
    });
}

// --- POST JOB MODAL ---
function initJobModal() {
    if (!dom.btnPostJob) return;

    dom.btnPostJob.addEventListener('click', () => {
        dom.jobModal.classList.add('open');
    });

    const closeJobModal = () => dom.jobModal.classList.remove('open');

    dom.closeJobModal.addEventListener('click', closeJobModal);
    dom.btnCancelJob.addEventListener('click', closeJobModal);

    dom.btnSaveJob.addEventListener('click', () => {
        const title = dom.jobTitleInput.value.trim() || "Senior Full Stack Engineer";
        const location = dom.jobLocationInput.value.trim() || "Amman, Jordan (Hybrid)";
        const salary = dom.jobSalaryInput.value.trim() || "$3,000 - $4,000 / mo";
        const requirements = dom.jobRequirementsInput.value.trim() || "Node.js, React, AWS, PostgreSQL";

        // Update recruiter UI display
        dom.activeJobTitleDisplay.textContent = title;
        dom.activeJobDetailsDisplay.textContent = `${location.split('(')[0]} | ${salary}`;

        // Update job seeker UI matches dynamically
        if (dom.seekerMatchTitle) {
            dom.seekerMatchTitle.textContent = title;
        }
        if (dom.seekerMatchSalary) {
            dom.seekerMatchSalary.textContent = salary;
        }
        if (dom.seekerMatchMeta) {
            dom.seekerMatchMeta.textContent = location;
        }

        closeJobModal();

        // Feed message into AI Co-pilot history
        addAiMessage(`System: Active hiring job updated to **${title}**. 
        • **Location:** ${location}
        • **Salary:** ${salary}
        • **Requirements:** \`${requirements}\`
        
        Now parsing and ranking candidate resumes against these requirements...`);
    });
}

// --- FILTERS & SEARCH ---
function initFilters() {
    dom.filterAll.addEventListener('click', () => setFilter('all'));
    dom.filterActive.addEventListener('click', () => setFilter('active'));
    dom.filterUnlocked.addEventListener('click', () => setFilter('unlocked'));

    // Natural Language Search / Emergency Hire Search
    dom.btnAiSearch.addEventListener('click', handleAiSearch);
    dom.poolSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAiSearch();
    });
}

let activeFilter = 'all'; // 'all' | 'active' | 'unlocked'
function setFilter(type) {
    activeFilter = type;
    [dom.filterAll, dom.filterActive, dom.filterUnlocked].forEach(el => el.classList.remove('active'));
    
    if (type === 'all') dom.filterAll.classList.add('active');
    if (type === 'active') dom.filterActive.classList.add('active');
    if (type === 'unlocked') dom.filterUnlocked.classList.add('active');

    renderCandidates();
}

function handleAiSearch() {
    const query = dom.poolSearch.value.trim().toLowerCase();
    if (!query) {
        renderCandidates();
        return;
    }

    addAiMessage(`Searching candidates for: "${query}"...`);

    // Sift pool by matching skills, title, location, or name (Local client sifting)
    const terms = query.split(/\s+/);
    const filtered = state.candidates.filter(c => {
        const text = `${c.name} ${c.title} ${c.location} ${c.skills.join(' ')}`.toLowerCase();
        return terms.every(term => text.includes(term));
    });

    renderCandidates(filtered);

    // If API key is available, run a semantic check message
    if (state.apiKey) {
        callGemini(`Analyze this list of candidates: ${JSON.stringify(filtered.map(f => ({name: f.name, title: f.title, skills: f.skills})))}. Rank them based on how they fit the query: "${query}" and summarize why in 3 bullet points.`)
            .then(aiRes => {
                addAiMessage(aiRes);
            });
    } else {
        setTimeout(() => {
            addAiMessage(`AI Search (Simulated): Found ${filtered.length} candidates matching your requirements. ${filtered.length > 0 ? filtered[0].name + ' ranks highest based on skill profiles.' : 'Try adjusting search terms.'}`);
        }, 800);
    }
}

// Find Similar Candidates Logic (Cosine/Keyword Similarity)
dom.btnSimilar.addEventListener('click', () => {
    if (!state.selectedCandidateId) return;
    const current = state.candidates.find(c => c.id === state.selectedCandidateId);
    if (!current) return;

    addAiMessage(`Finding candidates similar to ${current.name} (Lead)...`);

    // Similarity scoring based on overlapping skills
    const currentSkills = new Set(current.skills.map(s => s.toLowerCase()));
    
    const candidatesWithScores = state.candidates
        .filter(c => c.id !== current.id)
        .map(c => {
            const overlap = c.skills.filter(s => currentSkills.has(s.toLowerCase())).length;
            const score = (overlap / Math.max(1, currentSkills.size)) * 100;
            return { candidate: c, score: Math.round(score) };
        })
        .sort((a, b) => b.score - a.score);

    // Render results in chat
    setTimeout(() => {
        let msg = `### Similarity Matches for ${current.name}:\n`;
        candidatesWithScores.forEach(item => {
            msg += `* **${item.candidate.name}** (${item.candidate.title}): **${item.score}% skill overlap** (Skills: ${item.candidate.skills.slice(0, 3).join(', ')}...)\n`;
        });
        addAiMessage(msg);
    }, 700);
});

// --- RENDER CANDIDATES POOL ---
function renderCandidates(customList = null) {
    let list = customList || state.candidates;
    
    // Apply filters
    if (activeFilter === 'active') {
        // Filter: Status is available and updated within last 24h (mock simulation: all available ones are active)
        list = list.filter(c => c.status === 'available');
    } else if (activeFilter === 'unlocked') {
        list = list.filter(c => c.unlocked);
    }

    dom.candidatesContainer.innerHTML = '';
    
    if (list.length === 0) {
        dom.candidatesContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px 0;">
                No candidates match the filter.
            </div>`;
        return;
    }

    list.forEach(c => {
        const isSelected = c.id === state.selectedCandidateId;
        const statusBadge = c.status === 'available' 
            ? `<span class="badge badge-active"><span class="pulse-green"></span> Active</span>`
            : `<span class="badge badge-archive">Hired</span>`;

        const item = document.createElement('div');
        item.className = `candidate-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="candidate-info-row">
                <span class="candidate-name">${c.name}</span>
                ${statusBadge}
            </div>
            <div class="candidate-desc">${c.title}</div>
            <div class="candidate-desc" style="font-size: 0.7rem; opacity: 0.7;"><i class="fa-solid fa-location-dot"></i> ${c.location.split('(')[0]}</div>
        `;

        item.addEventListener('click', () => selectCandidate(c.id));
        dom.candidatesContainer.appendChild(item);
    });
}

// --- SELECT CANDIDATE ---
function selectCandidate(id) {
    state.selectedCandidateId = id;
    renderCandidates();

    const candidate = state.candidates.find(c => c.id === id);
    if (!candidate) return;

    // Load Preview
    dom.resumePlaceholder.style.display = 'none';
    dom.resumeTextContent.style.display = 'block';
    dom.previewActions.style.display = 'flex';

    // Set interactive CV content
    const skillsHtml = candidate.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
    const timelineHtml = candidate.experienceTimeline.map(e => `
        <div class="experience-item">
            <div class="exp-header">
                <span class="exp-role">${e.role} <span class="exp-company">@ ${e.company}</span></span>
                <span class="exp-date">${e.date}</span>
            </div>
            <p class="exp-desc">${e.desc}</p>
        </div>
    `).join('');

    dom.resumeTextContent.innerHTML = `
        <div class="profile-card-header">
            <div class="profile-details">
                <h1>${candidate.name}</h1>
                <p class="profile-title">${candidate.title}</p>
                <p class="profile-experience-tag"><i class="fa-solid fa-clock"></i> Experience: ${candidate.experience} | <i class="fa-solid fa-location-dot"></i> ${candidate.location}</p>
            </div>
            ${candidate.status === 'available' ? '<span class="badge badge-active"><span class="pulse-green"></span> Open for work</span>' : '<span class="badge badge-archive">Currently Employed</span>'}
        </div>

        <div class="cv-section">
            <h3>Core Skills</h3>
            <div class="skills-container">${skillsHtml}</div>
        </div>

        <div class="cv-section">
            <h3>Work Experience</h3>
            <div class="experience-timeline">${timelineHtml}</div>
        </div>
    `;

    // Reset Chat panel message
    dom.chatHistory.innerHTML = `
        <div class="chat-bubble ai-bubble">
            <p>I have parsed **${candidate.name}'s** resume. What specific questions do you have about their qualifications, history, or availability?</p>
        </div>
    `;

    // Load Voice Widget if candidate is active
    if (candidate.status === 'available') {
        dom.voiceWidget.style.display = 'block';
    } else {
        dom.voiceWidget.style.display = 'none';
    }

    // Set Monetization Locks
    if (candidate.unlocked) {
        dom.contactLockOverlay.style.display = 'none';
        dom.contactInfoPanel.style.display = 'block';
        dom.candidateEmail.textContent = candidate.email;
        dom.candidatePhone.textContent = candidate.phone;
        dom.candidateLinkedin.textContent = candidate.linkedin;
    } else {
        dom.contactLockOverlay.style.display = 'block';
        dom.contactInfoPanel.style.display = 'none';
    }

    // Reset Voice Speaking
    stopSpeaking();
}

// --- PAYWALL / UNLOCK CONTACT ---
dom.btnUnlockContact.addEventListener('click', () => {
    if (!state.selectedCandidateId) return;
    const candidate = state.candidates.find(c => c.id === state.selectedCandidateId);
    if (!candidate) return;

    // Unlock mock
    candidate.unlocked = true;
    selectCandidate(candidate.id);
    addAiMessage(`🔓 **Contact details unlocked** for ${candidate.name}. You can now send an interview invite or schedule a call directly.`);
});

// --- DRAG & DROP PDF PARSER ---
function initDragAndDrop() {
    ['dragenter', 'dragover'].forEach(name => {
        dom.dropZone.addEventListener(name, (e) => {
            e.preventDefault();
            dom.dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(name => {
        dom.dropZone.addEventListener(name, (e) => {
            e.preventDefault();
            dom.dropZone.classList.remove('dragover');
        }, false);
    });

    dom.dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    dom.dropZone.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    dom.progressContainer.style.display = 'block';
    let processed = 0;
    
    const updateProgress = (pct) => {
        dom.progressFill.style.width = `${pct}%`;
        dom.progressPercentage.textContent = `${pct}%`;
    };

    updateProgress(0);

    Array.from(files).forEach((file, index) => {
        if (file.type !== 'application/pdf') {
            alert('Only PDF files are supported.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            
            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                let maxPages = pdf.numPages;
                let countPromises = [];
                
                // Extract text from pages
                for (let i = 1; i <= maxPages; i++) {
                    let page = pdf.getPage(i);
                    countPromises.push(page.then(page => {
                        let textContent = page.getTextContent();
                        return textContent.then(text => {
                            return text.items.map(s => s.str).join(' ');
                        });
                    }));
                }
                
                Promise.all(countPromises).then(texts => {
                    const fullText = texts.join('\n');
                    
                    // Add Candidate to local state
                    processParsedText(file.name.replace('.pdf', ''), fullText);
                    
                    processed++;
                    let pct = Math.round((processed / files.length) * 100);
                    updateProgress(pct);

                    if (processed === files.length) {
                        setTimeout(() => {
                            dom.progressContainer.style.display = 'none';
                            renderCandidates();
                            addAiMessage(`Successfully imported and sifted **${files.length}** new resume PDFs locally.`);
                        }, 800);
                    }
                });
            });
        };
        reader.readAsArrayBuffer(file);
    });
}

// Local heuristics to map parsed PDF text into candidate profiles (Fallbacks to Gemini if API key is loaded)
function processParsedText(fileName, text) {
    // Generate mock properties
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/\+?[\d\s-]{8,15}/);
    
    // Extrapolate a few basic skills via regex
    const skillList = ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'AWS', 'Docker', 'Figma', 'UI/UX'];
    const foundSkills = skillList.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(text));

    const newCandidate = {
        id: 'c_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: fileName.replace(/[-_]/g, ' '),
        title: text.split(/[|\n]/)[0].trim().substring(0, 35) || 'Software Engineer',
        location: 'Jordan (Local Profile)',
        email: emailMatch ? emailMatch[0] : 'contact@email.com',
        phone: phoneMatch ? phoneMatch[0] : '+962 7 9000 0000',
        linkedin: 'linkedin.com/in/' + fileName.toLowerCase().replace(/\s+/g, '-'),
        skills: foundSkills.length > 0 ? foundSkills : ['Web Development', 'Problem Solving'],
        experience: '3+ Years',
        status: 'available',
        unlocked: false,
        updatedAt: new Date().toISOString(),
        experienceTimeline: [
            { role: 'Professional Role', company: 'Tech Corp', date: '2023 - Present', desc: text.substring(0, 150) + '...' }
        ],
        pitch: `Hi there! I am an active candidate uploaded directly to the dashboard. Let's talk!`,
        inquiries: []
    };

    state.candidates.unshift(newCandidate);
    
    // If API key is set, call Gemini to generate a high-quality summary and timeline
    if (state.apiKey) {
        callGemini(`Analyze the following raw parsed resume text and output a JSON profile mapping candidate details:
        Name, Title, Skills (Array), Experience Summary (String), ExperienceTimeline (Array with role, company, date, desc).
        
        Resume text:
        ${text.substring(0, 3000)}`)
            .then(aiJson => {
                try {
                    const parsed = JSON.parse(aiJson.substring(aiJson.indexOf('{'), aiJson.lastIndexOf('}') + 1));
                    if (parsed.Name) newCandidate.name = parsed.Name;
                    if (parsed.Title) newCandidate.title = parsed.Title;
                    if (parsed.Skills) newCandidate.skills = parsed.Skills;
                    if (parsed.ExperienceTimeline) newCandidate.experienceTimeline = parsed.ExperienceTimeline;
                    renderCandidates();
                } catch(e) {
                    console.log("Could not parse AI response as JSON", e);
                }
            });
    }
}

// --- CO-PILOT CHAT LOGIC ---
function initChatLogic() {
    dom.btnSendChat.addEventListener('click', handleChatSubmit);
    dom.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleChatSubmit();
        }
    });

    // Quick-Ask actions
    document.querySelectorAll('.btn-quick-ask').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = btn.getAttribute('data-prompt');
            dom.chatInput.value = prompt;
            handleChatSubmit();
        });
    });
}

function handleChatSubmit() {
    const text = dom.chatInput.value.trim();
    if (!text) return;

    // Render User Bubble
    addUserMessage(text);
    dom.chatInput.value = '';

    const candidate = state.candidates.find(c => c.id === state.selectedCandidateId);
    if (!candidate) {
        setTimeout(() => {
            addAiMessage("Please select a candidate from the pool first to ask specific questions about their resume.");
        }, 500);
        return;
    }

    // Call Gemini or Mock
    if (state.apiKey) {
        addAiMessage("Thinking...");
        const context = `You are an AI co-pilot reviewing ${candidate.name}'s resume. 
        Title: ${candidate.title}. 
        Skills: ${candidate.skills.join(', ')}.
        Timeline: ${JSON.stringify(candidate.experienceTimeline)}.
        
        Question: ${text}`;

        callGemini(context).then(aiRes => {
            // Remove thinking message
            const thinking = dom.chatHistory.querySelector('.ai-bubble:last-child');
            if (thinking && thinking.textContent === 'Thinking...') {
                thinking.remove();
            }
            addAiMessage(aiRes);
        });
    } else {
        // Simulated response based on query keywords
        setTimeout(() => {
            let reply = `Here's what I found on ${candidate.name}'s CV:\n`;
            if (text.toLowerCase().includes('summary') || text.toLowerCase().includes('experience')) {
                reply += `* **Role:** ${candidate.title}\n* **Tenure:** ${candidate.experience}\n* **Key Job:** worked at **${candidate.experienceTimeline[0]?.company}** as a ${candidate.experienceTimeline[0]?.role}.`;
            } else if (text.toLowerCase().includes('tech') || text.toLowerCase().includes('stack') || text.toLowerCase().includes('skills')) {
                reply += `* **Skills found:** ${candidate.skills.join(', ')}.\n* They demonstrate strong familiarity with core development layers.`;
            } else if (text.toLowerCase().includes('abroad') || text.toLowerCase().includes('global')) {
                reply += `* Based on the location profile (**${candidate.location}**), they are open to global relocation and cross-border teams.`;
            } else {
                reply += `* Malik has 6+ years experience focusing on React, Node, and AWS architecture. Let me know if you want to unlock his contact info for a direct call.`;
            }
            addAiMessage(reply);
        }, 600);
    }
}

function addUserMessage(msg) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user-bubble';
    bubble.innerHTML = `<p>${msg}</p>`;
    dom.chatHistory.appendChild(bubble);
    dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
}

function addAiMessage(msg) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ai-bubble';
    
    // Basic Markdown converter
    let html = msg
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\n/g, '• $1<br>')
        .replace(/### (.*?)\n/g, '<h4>$1</h4>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    bubble.innerHTML = `<p>${html}</p>`;
    dom.chatHistory.appendChild(bubble);
    dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
}

// --- VOICE SYNTHESIS & RECORDING ---
let mediaRecorder = null;
let audioChunks = [];

function initVoiceSynthesis() {
    dom.btnListenPitch.addEventListener('click', () => {
        const candidate = state.candidates.find(c => c.id === state.selectedCandidateId);
        if (!candidate) return;

        if (state.isSpeaking) {
            stopSpeaking();
            return;
        }

        // Simulate playing pre-recorded candidate pitch
        speakText(candidate.pitch);
    });

    dom.btnRecordInquiry.addEventListener('click', async () => {
        const candidate = state.candidates.find(c => c.id === state.selectedCandidateId);
        if (!candidate) return;

        if (state.isRecording) {
            // Stop recording
            state.isRecording = false;
            dom.btnRecordInquiry.innerHTML = `<i class="fa-solid fa-microphone"></i> Record Inquiry`;
            dom.btnRecordInquiry.classList.remove('btn-primary');
            dom.btnRecordInquiry.classList.add('btn-primary');
            dom.avatarAudioIndicator.classList.remove('speaking');

            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }

            // Transmit recorded message
            addAiMessage(`🎤 **Voice Inquiry Sent!** Your recorded voice note has been sent to ${candidate.name}.`);

            // Simulate the candidate receiving and replying with their own actual voice
            setTimeout(() => {
                addAiMessage(`System: ${candidate.name} was notified of your voice note. Preparing response...`);
                
                setTimeout(() => {
                    const responseText = `Hi, thank you for your query. Yes, I've managed several scalable infrastructures using AWS, specifically VPC route tables, EC2 configurations, and AWS Lambda serverless execution. I'd love to jump on an interview and talk details.`;
                    
                    // Create an inline audio playback card in chat
                    const replyBubble = document.createElement('div');
                    replyBubble.className = 'chat-bubble ai-bubble';
                    replyBubble.style.borderLeft = '3px solid var(--accent-cyan)';
                    replyBubble.innerHTML = `
                        <p>🔊 <b>Voice Reply from ${candidate.name}</b> (0:12)</p>
                        <button class="btn btn-secondary btn-sm" id="btn-play-candidate-reply" style="margin-top: 6px;">
                            <i class="fa-solid fa-play"></i> Play Voice Response
                        </button>
                    `;
                    dom.chatHistory.appendChild(replyBubble);
                    dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;

                    // Bind play button
                    document.getElementById('btn-play-candidate-reply').addEventListener('click', () => {
                        speakText(responseText);
                    });

                    addAiMessage(`📩 **Voice Response Received from ${candidate.name}!** Play it above.`);
                }, 2000);
            }, 800);

        } else {
            // Start recording recruiter's microphone stream
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    // audioBlob holds the actual audio clip recorded by the recruiter
                };

                mediaRecorder.start();
                state.isRecording = true;
                dom.btnRecordInquiry.innerHTML = `<i class="fa-solid fa-square"></i> Stop Recording`;
                dom.avatarAudioIndicator.classList.add('speaking');
            } catch (err) {
                console.warn("Microphone access blocked or unavailable. Running in simulated recording mode:", err);
                
                // Fallback simulation
                state.isRecording = true;
                dom.btnRecordInquiry.innerHTML = `<i class="fa-solid fa-square"></i> Stop Recording`;
                dom.avatarAudioIndicator.classList.add('speaking');
            }
        }
    });
}

function speakText(text) {
    stopSpeaking();

    state.isSpeaking = true;
    dom.avatarAudioIndicator.classList.add('speaking');
    dom.btnListenPitch.innerHTML = `<i class="fa-solid fa-square"></i> Stop`;

    state.speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
    
    // Choose voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        state.speechSynthesisUtterance.voice = voices[0];
    }

    state.speechSynthesisUtterance.onend = () => {
        state.isSpeaking = false;
        dom.avatarAudioIndicator.classList.remove('speaking');
        dom.btnListenPitch.innerHTML = `<i class="fa-solid fa-play"></i> Play Pitch`;
    };

    window.speechSynthesis.speak(state.speechSynthesisUtterance);
}

function stopSpeaking() {
    window.speechSynthesis.cancel();
    state.isSpeaking = false;
    dom.avatarAudioIndicator.classList.remove('speaking');
    dom.btnListenPitch.innerHTML = `<i class="fa-solid fa-play"></i> Play Pitch`;
}

// --- JOB-SEEKER DASHBOARD LOGIC ---
function initJobSeekerControls() {
    // Status Retention Toggles (Still Available vs Hired)
    dom.btnStatusAvailable.addEventListener('click', () => {
        dom.btnStatusAvailable.classList.add('active');
        dom.btnStatusHired.classList.remove('active');
        dom.statusHelperText.innerHTML = `🟢 You are currently visible to recruiters searching for emergency hires. Bounded active feed update.`;
        
        // Mock updating local seeker candidate c1
        const seeker = state.candidates.find(c => c.id === 'c1');
        if (seeker) {
            seeker.status = 'available';
            seeker.updatedAt = new Date().toISOString();
        }
        
        alert("Status updated! Your profile has been bumped to the top of recruiter feeds.");
    });

    dom.btnStatusHired.addEventListener('click', () => {
        dom.btnStatusAvailable.classList.remove('active');
        dom.btnStatusHired.classList.add('active');
        dom.statusHelperText.innerHTML = `🔴 Profile archived. Recruiters can no longer search or view your contact card.`;

        // Mock updating local seeker candidate c1
        const seeker = state.candidates.find(c => c.id === 'c1');
        if (seeker) {
            seeker.status = 'hired';
        }

        alert("Profile archived. You won't receive incoming recruiter queries.");
    });

    // Seeker upload logic
    dom.seekerUploadZone.addEventListener('click', () => dom.seekerFileInput.click());
    dom.seekerFileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        const file = files[0];
        if (file.type !== 'application/pdf') {
            alert('Only PDF files are supported.');
            return;
        }

        const originalTextarea = document.getElementById('optimizer-original-cv');
        if (originalTextarea) {
            originalTextarea.placeholder = "Reading PDF, please wait...";
            originalTextarea.value = "";
        }

        const reader = new FileReader();
        reader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            
            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                let maxPages = pdf.numPages;
                let countPromises = [];
                
                for (let i = 1; i <= maxPages; i++) {
                    let page = pdf.getPage(i);
                    countPromises.push(page.then(page => {
                        let textContent = page.getTextContent();
                        return textContent.then(text => {
                            return text.items.map(s => s.str).join(' ');
                        });
                    }));
                }
                
                Promise.all(countPromises).then(texts => {
                    const fullText = texts.join('\n');
                    
                    if (originalTextarea) {
                        originalTextarea.value = fullText;
                    }
                    alert("CV text parsed from PDF successfully! Click 'Optimize CV' below to optimize.");
                });
            }).catch(err => {
                console.error("Error reading PDF:", err);
                alert("Could not extract text from this PDF file. You can still paste your CV text manually in the box.");
                if (originalTextarea) {
                    originalTextarea.placeholder = "Paste your raw experience text here...";
                }
            });
        };
        reader.readAsArrayBuffer(file);
    });

    initCvOptimizer();
}

function initCvOptimizer() {
    const btnRun = document.getElementById('btn-run-optimizer');
    const btnCopy = document.getElementById('btn-copy-optimized');
    const btnDownload = document.getElementById('btn-download-pdf');
    const btnDownloadTxt = document.getElementById('btn-download-txt');
    const originalTextarea = document.getElementById('optimizer-original-cv');
    const resultTextarea = document.getElementById('optimizer-result-cv');
    const resultsContainer = document.getElementById('optimizer-results-container');

    if (!btnRun) return;

    btnRun.addEventListener('click', () => {
        const text = originalTextarea.value.trim();
        if (!text) {
            alert("Please paste or upload your CV text first.");
            return;
        }

        btnRun.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Optimizing...`;
        
        if (state.apiKey) {
            const prompt = `You are an expert resume writer and ATS optimizer. Rewrite the following resume text to optimize it for keywords, add strong action verbs, and structure it into a clean, professional resume format. 
            IMPORTANT: Return ONLY the final formatted resume content. Do not include any explanations, markdown code blocks (like \`\`\`text), introductory remarks, or descriptions of the changes you made. Start directly with the candidate's name.
            
            ${text}`;
            
            callGemini(prompt).then(optimizedText => {
                // Clean markdown code blocks if any got through
                let cleaned = optimizedText.replace(/^```[a-zA-Z]*\n/gm, '').replace(/```$/gm, '').trim();
                resultTextarea.value = cleaned;
                resultsContainer.style.display = 'block';
                btnCopy.style.display = 'inline-flex';
                btnDownload.style.display = 'inline-flex';
                if (btnDownloadTxt) btnDownloadTxt.style.display = 'inline-flex';
                btnRun.innerHTML = `<i class="fa-solid fa-bolt"></i> Re-Optimize CV`;
                alert("CV Optimized successfully! See your clean resume formatting below.");
            }).catch(err => {
                console.error("Gemini error:", err);
                btnRun.innerHTML = `<i class="fa-solid fa-bolt"></i> Optimize CV`;
                alert("Error running Gemini API. Check your API key in Settings.");
            });
        } else {
            // Simulated Optimizer
            setTimeout(() => {
                const seeker = state.candidates.find(c => c.id === 'c1');
                const name = seeker ? seeker.name : 'Malik Al-Raji';
                const title = seeker ? seeker.title : 'Senior Full Stack Engineer';
                const location = seeker ? seeker.location : 'Amman, Jordan';
                const skills = seeker ? seeker.skills.join(', ') : 'Node.js, React, AWS, PostgreSQL, Docker';

                const optimizedMock = `${name}
${title} | ${location}

SUMMARY
Results-driven ${title} with 6+ years of expertise architecting scalable web applications, microservices, and high-performance system designs. Recognized for reducing AWS infrastructure costs by 35% and improving search indexing query speeds.

EXPERIENCE

Senior Engineer | Liwwa Fintech (2024 - Present)
• Engineered and launched scalable high-performance backend microservices, reducing AWS infrastructure billing by 35% through runtime optimization.
• Collaborated with core teams to scale transactional database nodes, sustaining 10k+ concurrent requests.
• Redesigned microservice interactions, improving system test coverage and reducing delivery lag.

Software Developer | Mawdoo3 (2020 - 2024)
• Architected dynamic modular layout components servicing millions of unique daily website hits.
• Optimized search index query latency by 22% using Elasticsearch indexing structures.
• Standardized REST API patterns across teams to facilitate cleaner frontend integrations.

CORE SKILLS
${skills}, System Architecture, CI/CD Pipelines, AWS Cloud Solutions, Performance Tuning.`;

                resultTextarea.value = optimizedMock;
                resultsContainer.style.display = 'block';
                btnCopy.style.display = 'inline-flex';
                btnDownload.style.display = 'inline-flex';
                if (btnDownloadTxt) btnDownloadTxt.style.display = 'inline-flex';
                btnRun.innerHTML = `<i class="fa-solid fa-bolt"></i> Re-Optimize CV`;
                alert("CV Optimized (Simulated)! Add your Gemini API Key in Settings to get customized real AI edits.");
            }, 1500);
        }
    });

    btnCopy.addEventListener('click', () => {
        resultTextarea.select();
        navigator.clipboard.writeText(resultTextarea.value);
        alert("Optimized CV copied to clipboard!");
    });

    btnDownload.addEventListener('click', () => {
        const resumeText = resultTextarea.value.trim();
        if (!resumeText) return;
        printFormattedResume(resumeText);
    });

    if (btnDownloadTxt) {
        btnDownloadTxt.addEventListener('click', () => {
            const resumeText = resultTextarea.value.trim();
            if (!resumeText) return;
            // Use the first line as candidate name for the filename
            const nameLine = resumeText.split('\n')[0].trim();
            const safeName = nameLine.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `${safeName}_Optimized_CV.txt`;
            
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(resumeText));
            element.setAttribute('download', filename);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        });
    }
}

function printFormattedResume(text) {
    const lines = text.split('\n');
    let htmlContent = '';
    let inList = false;

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
            if (inList) {
                htmlContent += '</ul>';
                inList = false;
            }
            return;
        }

        // First line is candidate name
        if (idx === 0) {
            htmlContent += `<h1 style="text-align: center; margin-top: 0; margin-bottom: 5px; font-size: 28px; font-family: 'Outfit', sans-serif; color: #111;">${trimmed}</h1>`;
            return;
        }
        
        // Second line is title / contact details
        if (idx === 1 || (idx === 2 && lines[1].trim() === '')) {
            htmlContent += `<p style="text-align: center; margin-top: 0; margin-bottom: 25px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 2px solid #333; padding-bottom: 12px;">${trimmed}</p>`;
            return;
        }

        // Section headers (all uppercase or specific keywords)
        const isHeader = /^[A-Z\s]{4,20}$/.test(trimmed) || trimmed === 'CORE SKILLS' || trimmed === 'WORK EXPERIENCE';
        if (isHeader) {
            if (inList) {
                htmlContent += '</ul>';
                inList = false;
            }
            htmlContent += `<h2 style="font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; color: #111; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 25px; margin-bottom: 12px; font-family: 'Outfit', sans-serif;">${trimmed}</h2>`;
            return;
        }

        // Bullet point detection
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
            if (!inList) {
                htmlContent += '<ul style="margin-top: 5px; margin-bottom: 10px; padding-left: 20px;">';
                inList = true;
            }
            const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
            htmlContent += `<li style="font-size: 13px; color: #333; margin-bottom: 5px; line-height: 1.5;">${bulletText}</li>`;
            return;
        }

        // Paragraph or company details
        if (inList) {
            htmlContent += '</ul>';
            inList = false;
        }

        if (trimmed.includes('|') || trimmed.includes('@')) {
            htmlContent += `<p style="font-size: 13px; font-weight: 600; color: #111; margin-top: 15px; margin-bottom: 4px;">${trimmed}</p>`;
        } else {
            htmlContent += `<p style="font-size: 13px; color: #444; margin-top: 6px; margin-bottom: 6px; line-height: 1.5;">${trimmed}</p>`;
        }
    });

    if (inList) {
        htmlContent += '</ul>';
    }

    const printWindow = window.open('', '_blank', 'width=850,height=950');
    printWindow.document.write(`
        <html>
        <head>
            <title>BioSpark Optimized Resume</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    color: #333;
                    margin: 50px;
                    background: #fff;
                }
                h1, h2 {
                    font-weight: 600;
                }
                @media print {
                    body {
                        margin: 25px;
                    }
                    /* Suppress default headers/footers */
                    @page {
                        margin: 1.5cm;
                    }
                }
            </style>
        </head>
        <body>
            ${htmlContent}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function loadJobSeekerConfig() {
    // Preload candidate's CV text into original CV text box
    const seeker = state.candidates.find(c => c.id === 'c1');
    const originalTextarea = document.getElementById('optimizer-original-cv');
    if (seeker && originalTextarea) {
        originalTextarea.value = `${seeker.name}\n${seeker.title}\nLocation: ${seeker.location}\n\nCore Skills: ${seeker.skills.join(', ')}\n\nExperience:\n${seeker.experienceTimeline.map(e => `- ${e.role} @ ${e.company} (${e.date}): ${e.desc}`).join('\n')}`;
    }
}

// --- GEMINI API CONNECTOR ---
async function callGemini(promptText) {
    if (!state.apiKey) return "Simulated Mode: No API key configured.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${state.apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error("Gemini API HTTP Error:", response.status, errorDetails);
            return `API Error (Status ${response.status}): ${errorDetails}`;
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return `API Error: Unexpected response structure. Raw: ${JSON.stringify(data)}`;
        }
    } catch(err) {
        console.error("Gemini Fetch Network Error:", err);
        return `Error: Failed to fetch response from Gemini. Please verify your internet connection. (Details: ${err.message})`;
    }
}

// --- SIMULATED UTILS ---
function playMockVoice() {
    const text = "Do you have experience managing production AWS deployments?";
    const msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(msg);
}

function copyPortfolioLink() {
    navigator.clipboard.writeText("biospark.com/cv/johndoe");
    alert("Copied to clipboard!");
}

// --- MOBILE NAVIGATION TAB SWITCHER ---
function switchMobileTab(tabIndex) {
    const gridId = state.currentView === 'recruiter' ? 'recruiter-workspace' : 'jobseeker-workspace';
    const grid = document.getElementById(gridId);
    if (!grid) return;

    // Toggle panels in grid
    grid.classList.remove('show-panel-1', 'show-panel-2', 'show-panel-3');
    grid.classList.add(`show-panel-${tabIndex}`);

    // Update active tab buttons
    document.querySelectorAll('.mobile-nav-btn').forEach((btn, index) => {
        if (index === tabIndex - 1) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
window.switchMobileTab = switchMobileTab; // Expose globally for HTML onclick
