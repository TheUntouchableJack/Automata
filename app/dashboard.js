// ===== Dashboard Initialization =====
let currentUser = null;
let currentOrganization = null;

async function initDashboard() {
    // Require authentication
    currentUser = await requireAuth();
    if (!currentUser) return;

    // Load user info
    await loadUserInfo();

    // Load user's organization
    await loadOrganization();

    // Load projects
    await loadProjects();

    // Setup event listeners
    setupEventListeners();
}

// ===== Load Organization =====
async function loadOrganization() {
    try {
        // First get the membership
        const { data: memberships, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', currentUser.id)
            .limit(1);

        if (memberError) throw memberError;

        if (!memberships || memberships.length === 0) {
            console.error('No organization membership found');
            return;
        }

        // Then get the organization details
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, slug')
            .eq('id', memberships[0].organization_id)
            .single();

        if (orgError) throw orgError;

        currentOrganization = org;
    } catch (error) {
        console.error('Error loading organization:', error);
    }
}

// ===== Load User Info =====
async function loadUserInfo() {
    const profile = await getUserProfile(currentUser.id);

    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');

    if (profile && (profile.first_name || profile.last_name)) {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        const initials = getInitials(profile.first_name, profile.last_name);
        userAvatar.textContent = initials;
        userName.textContent = fullName;
    } else {
        const initials = currentUser.email.substring(0, 2).toUpperCase();
        userAvatar.textContent = initials;
        userName.textContent = currentUser.email.split('@')[0];
    }
}

function getInitials(firstName, lastName) {
    if (firstName && lastName) {
        return (firstName[0] + lastName[0]).toUpperCase();
    } else if (firstName) {
        return firstName.substring(0, 2).toUpperCase();
    } else if (lastName) {
        return lastName.substring(0, 2).toUpperCase();
    }
    return '?';
}

// ===== Load Projects =====
async function loadProjects() {
    const loading = document.getElementById('loading');
    const projectsGrid = document.getElementById('projects-grid');
    const emptyState = document.getElementById('empty-state');

    if (!currentOrganization) {
        loading.innerHTML = '<p style="color: var(--color-error);">No organization found. Please contact support.</p>';
        return;
    }

    try {
        const { data: projects, error } = await supabase
            .from('projects')
            .select(`
                *,
                automations(count)
            `)
            .eq('organization_id', currentOrganization.id)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        loading.style.display = 'none';

        if (!projects || projects.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        projectsGrid.style.display = 'grid';
        renderProjects(projects);

    } catch (error) {
        console.error('Error loading projects:', error);
        loading.innerHTML = '<p style="color: var(--color-error);">Error loading projects. Please refresh.</p>';
    }
}

function renderProjects(projects) {
    const projectsGrid = document.getElementById('projects-grid');

    const projectCards = projects.map(project => {
        const automationCount = project.automations?.[0]?.count || 0;
        const createdDate = new Date(project.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-card-header">
                    <div class="project-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 10H16M8 14H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    ${project.industry ? `<span class="project-industry">${project.industry}</span>` : ''}
                </div>
                <h3 class="project-name">${escapeHtml(project.name)}</h3>
                <p class="project-description">${escapeHtml(project.description || 'No description')}</p>
                <div class="project-meta">
                    <span class="project-meta-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M8 5V8L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        ${createdDate}
                    </span>
                    <span class="project-meta-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8L7 12L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${automationCount} automation${automationCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    // Add create project card at the end
    const createCard = `
        <div class="create-project-card" id="create-project-card">
            <div class="create-project-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <span>Create New Project</span>
        </div>
    `;

    projectsGrid.innerHTML = projectCards + createCard;

    // Add click handlers for project cards
    document.querySelectorAll('.project-card[data-project-id]').forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.dataset.projectId;
            if (projectId) {
                // Use hash-based routing since server strips query params
                window.location.href = `/app/project.html#${projectId}`;
            }
        });
    });

    // Add click handler for create card
    document.getElementById('create-project-card').addEventListener('click', openCreateModal);
}

// ===== Event Listeners =====
function setupEventListeners() {
    // User menu toggle
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');

    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await signOut();
    });

    // New project buttons
    document.getElementById('new-project-btn').addEventListener('click', openCreateModal);
    document.getElementById('empty-new-project-btn')?.addEventListener('click', openCreateModal);

    // Modal controls
    document.getElementById('modal-close').addEventListener('click', closeCreateModal);
    document.getElementById('modal-cancel').addEventListener('click', closeCreateModal);

    // Close modal on overlay click
    document.getElementById('create-project-modal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeCreateModal();
        }
    });

    // Create project form
    document.getElementById('create-project-form').addEventListener('submit', handleCreateProject);

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCreateModal();
        }
    });
}

// ===== Modal Functions =====
function openCreateModal() {
    document.getElementById('create-project-modal').classList.add('active');
    document.getElementById('project-name').focus();
}

function closeCreateModal() {
    document.getElementById('create-project-modal').classList.remove('active');
    document.getElementById('create-project-form').reset();
}

// ===== Create Project =====
async function handleCreateProject(e) {
    e.preventDefault();

    const createBtn = document.getElementById('create-btn');
    const originalText = createBtn.textContent;

    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const industry = document.getElementById('project-industry').value;

    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([{
                organization_id: currentOrganization.id,
                created_by: currentUser.id,
                name,
                description,
                industry: industry || null,
                settings: {}
            }])
            .select()
            .single();

        if (error) throw error;

        // Celebrate!
        celebrate();
        createBtn.textContent = 'Created!';
        createBtn.classList.add('btn-success');

        // Redirect to the new project after brief celebration
        setTimeout(() => {
            window.location.href = `/app/project.html#${data.id}`;
        }, 800);

    } catch (error) {
        console.error('Error creating project:', error);
        alert('Error creating project. Please try again.');
        createBtn.disabled = false;
        createBtn.textContent = originalText;
    }
}

// ===== Utility Functions =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
