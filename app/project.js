// ===== Project Page Initialization =====
let currentUser = null;
let currentProject = null;
let projectGoals = [];
let projectPainPoints = [];
let projectCompetitors = [];
let projectCompetitiveAdvantage = '';
let selectedCustomerIds = new Set();
let allOrgCustomers = [];
let selectedProjectIcon = 'workflow';

async function initProject() {
    // Require authentication
    currentUser = await requireAuth();
    if (!currentUser) return;

    // Get project ID from URL hash (fallback to query param for compatibility)
    let projectId = window.location.hash.slice(1);
    if (!projectId) {
        const urlParams = new URLSearchParams(window.location.search);
        projectId = urlParams.get('id');
    }

    if (!projectId) {
        window.location.href = '/app/dashboard.html';
        return;
    }

    // Load user info
    await loadUserInfo();

    // Load project
    await loadProject(projectId);

    // Setup event listeners
    setupEventListeners();
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

// ===== Load Project =====
async function loadProject(projectId) {
    const loading = document.getElementById('loading');

    try {
        // Load project details (RLS handles authorization via organization membership)
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            console.error('Project not found or access denied:', error);
            window.location.href = '/app/dashboard.html';
            return;
        }

        currentProject = project;

        // Update page with project info
        document.getElementById('breadcrumb-project').textContent = project.name;
        document.getElementById('project-title').textContent = project.name;
        document.getElementById('project-description').textContent = project.description || '';

        if (project.industry) {
            const industryBadge = document.getElementById('project-industry');
            industryBadge.textContent = project.industry;
            industryBadge.style.display = 'inline-flex';
        }

        // Populate overview form fields
        document.getElementById('details-name').value = project.name;
        document.getElementById('details-description').value = project.description || '';
        document.getElementById('details-industry').value = project.industry || '';
        document.getElementById('details-target-market').value = project.target_market || '';
        document.getElementById('details-location').value = project.location || '';

        // Load business context (goals, pain points, competitors, competitive advantage)
        projectGoals = project.goals || [];
        projectPainPoints = project.pain_points || [];
        projectCompetitors = project.competitors || [];
        projectCompetitiveAdvantage = project.competitive_advantage || '';

        // Populate view mode
        updateDetailsViewMode();
        updateContextViewMode();

        // Check if analyze button should be enabled
        updateAnalyzeButtonState();

        // Load automations
        await loadAutomations(projectId);

        // Load project customers
        await loadProjectCustomers(projectId);

        // Load opportunities
        if (typeof loadOpportunities === 'function') {
            await loadOpportunities(projectId);
        }

        loading.style.display = 'none';

    } catch (error) {
        console.error('Error loading project:', error);
        loading.innerHTML = '<p style="color: var(--color-error);">Error loading project. Please refresh.</p>';
    }
}

// ===== Load Automations =====
async function loadAutomations(projectId) {
    const automationsList = document.getElementById('automations-list');
    const emptyState = document.getElementById('empty-automations');
    const automationsTab = document.getElementById('automations-tab');

    try {
        const { data: automations, error } = await supabase
            .from('automations')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        automationsTab.style.display = 'block';

        if (!automations || automations.length === 0) {
            automationsList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        automationsList.style.display = 'flex';
        renderAutomations(automations);

    } catch (error) {
        console.error('Error loading automations:', error);
    }
}

function renderAutomations(automations) {
    const automationsList = document.getElementById('automations-list');

    automationsList.innerHTML = automations.map(automation => {
        // Use icon library if available, otherwise fallback to type-based icon
        let typeIcon;
        if (automation.icon && typeof getIconSvg === 'function') {
            typeIcon = getIconSvg(automation.icon);
        } else if (automation.type === 'blog_generation') {
            typeIcon = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M8 8H16M8 12H16M8 16H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
        } else {
            typeIcon = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M2 8L12 14L22 8" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
        }

        const statusClass = automation.is_active ? 'active' : 'inactive';
        const statusText = automation.is_active ? 'Active' : 'Inactive';
        const description = automation.description || `${formatType(automation.type)} running ${automation.frequency}. Click to configure settings and view generated content.`;

        return `
            <a href="/app/automation.html#${automation.id}" class="automation-card">
                <div class="automation-icon">
                    ${typeIcon}
                </div>
                <div class="automation-name">${escapeHtml(automation.name)}</div>
                <div class="automation-description">${escapeHtml(description)}</div>
                <div class="automation-status-badge ${statusClass}">
                    <span class="status-dot"></span>
                    ${statusText}
                </div>
            </a>
        `;
    }).join('');
}

function formatType(type) {
    const types = {
        'blog_generation': 'Blog Generation',
        'email': 'Email'
    };
    return types[type] || type;
}

// ===== Load Project Customers =====
async function loadProjectCustomers(projectId) {
    const list = document.getElementById('project-customers-list');
    const emptyState = document.getElementById('empty-project-customers');

    try {
        const { data: projectCustomers, error } = await supabase
            .from('project_customers')
            .select(`
                id,
                customer_id,
                customers (
                    id,
                    first_name,
                    last_name,
                    email,
                    company
                )
            `)
            .eq('project_id', projectId)
            .order('added_at', { ascending: false });

        if (error) throw error;

        if (!projectCustomers || projectCustomers.length === 0) {
            list.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        renderProjectCustomers(projectCustomers);

    } catch (error) {
        console.error('Error loading project customers:', error);
    }
}

function renderProjectCustomers(projectCustomers) {
    const list = document.getElementById('project-customers-list');

    list.innerHTML = projectCustomers.map(pc => {
        const customer = pc.customers;
        if (!customer) return '';

        const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unknown';
        const initials = getInitials(customer.first_name, customer.last_name);

        return `
            <div class="project-customer-card" data-id="${pc.id}">
                <div class="customer-info">
                    <span class="customer-avatar">${initials}</span>
                    <div class="customer-details">
                        <h4>${escapeHtml(name)}</h4>
                        <p>${escapeHtml(customer.email || customer.company || 'No email')}</p>
                    </div>
                </div>
                <button class="remove-customer-btn" onclick="removeProjectCustomer('${pc.id}')" title="Remove from project">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

async function removeProjectCustomer(pcId) {
    try {
        const { error } = await supabase
            .from('project_customers')
            .delete()
            .eq('id', pcId);

        if (error) throw error;

        await loadProjectCustomers(currentProject.id);

    } catch (error) {
        console.error('Error removing customer:', error);
        alert('Error removing customer. Please try again.');
    }
}

window.removeProjectCustomer = removeProjectCustomer;

// ===== Toggle Automation =====
async function toggleAutomation(automationId, isActive) {
    try {
        const { error } = await supabase
            .from('automations')
            .update({ is_active: isActive })
            .eq('id', automationId);

        if (error) throw error;

    } catch (error) {
        console.error('Error toggling automation:', error);
        alert('Error updating automation. Please try again.');
        // Reload to reset toggle state
        await loadAutomations(currentProject.id);
    }
}

// Make available globally for onclick handler
window.toggleAutomation = toggleAutomation;

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

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // New automation buttons
    document.getElementById('new-automation-btn').addEventListener('click', openAutomationModal);
    document.getElementById('empty-new-automation-btn')?.addEventListener('click', openAutomationModal);

    // Automation modal controls
    document.getElementById('automation-modal-close').addEventListener('click', closeAutomationModal);
    document.getElementById('automation-modal-cancel').addEventListener('click', closeAutomationModal);

    document.getElementById('create-automation-modal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeAutomationModal();
        }
    });

    // Create automation form
    document.getElementById('create-automation-form').addEventListener('submit', handleCreateAutomation);

    // Icon detection on name/description change
    document.getElementById('automation-name')?.addEventListener('blur', handleProjectIconDetection);
    document.getElementById('automation-description')?.addEventListener('blur', handleProjectIconDetection);

    // Initialize icon picker
    initProjectIconPicker();

    // Project details form (in Overview tab)
    document.getElementById('edit-details-btn')?.addEventListener('click', showDetailsEditMode);
    document.getElementById('cancel-details-btn')?.addEventListener('click', hideDetailsEditMode);
    document.getElementById('project-details-form').addEventListener('submit', handleSaveDetails);

    // Business context view/edit toggle
    document.getElementById('edit-context-btn')?.addEventListener('click', showContextEditMode);
    document.getElementById('cancel-context-btn')?.addEventListener('click', hideContextEditMode);
    document.getElementById('save-context-btn')?.addEventListener('click', handleSaveContext);

    // Delete project
    document.getElementById('delete-project-btn').addEventListener('click', handleDeleteProject);

    // Add customers modal
    document.getElementById('add-project-customers-btn')?.addEventListener('click', openCustomersModal);
    document.getElementById('empty-add-customers-btn')?.addEventListener('click', openCustomersModal);
    document.getElementById('customers-modal-close')?.addEventListener('click', closeCustomersModal);
    document.getElementById('customers-modal-cancel')?.addEventListener('click', closeCustomersModal);
    document.getElementById('add-customers-modal')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeCustomersModal();
    });
    document.getElementById('add-selected-customers-btn')?.addEventListener('click', handleAddSelectedCustomers);
    document.getElementById('customer-search')?.addEventListener('input', filterSelectableCustomers);

    // Create new customer from project
    document.getElementById('create-new-customer-btn')?.addEventListener('click', showCreateCustomerView);
    document.getElementById('back-to-select-btn')?.addEventListener('click', showSelectCustomersView);
    document.getElementById('new-customer-form')?.addEventListener('submit', handleCreateNewCustomer);

    // Dismiss banner
    document.getElementById('dismiss-banner')?.addEventListener('click', dismissIncompleteBanner);

    // AI Opportunities
    document.getElementById('analyze-btn')?.addEventListener('click', () => {
        if (typeof generateOpportunities === 'function') {
            generateOpportunities(currentProject);
        }
    });
    document.getElementById('refresh-opportunities-btn')?.addEventListener('click', () => {
        if (typeof generateOpportunities === 'function') {
            generateOpportunities(currentProject);
        }
    });
    document.getElementById('show-more-btn')?.addEventListener('click', () => {
        if (typeof showMoreOpportunities === 'function') {
            showMoreOpportunities();
        }
    });

    // AI Diagnosis
    document.getElementById('run-diagnosis-btn')?.addEventListener('click', runProjectDiagnosis);

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAutomationModal();
            closeCustomersModal();
        }
    });
}

// ===== Tab Switching =====
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.getElementById('overview-tab').style.display = tabName === 'overview' ? 'block' : 'none';
    document.getElementById('automations-tab').style.display = tabName === 'automations' ? 'block' : 'none';
    document.getElementById('customers-tab').style.display = tabName === 'customers' ? 'block' : 'none';
    document.getElementById('settings-tab').style.display = tabName === 'settings' ? 'block' : 'none';
}

// ===== Automation Modal =====
function openAutomationModal() {
    document.getElementById('create-automation-modal').classList.add('active');
    document.getElementById('automation-name').focus();
}

function closeAutomationModal() {
    document.getElementById('create-automation-modal').classList.remove('active');
    document.getElementById('create-automation-form').reset();
}

// ===== Create Automation =====
async function handleCreateAutomation(e) {
    e.preventDefault();

    const createBtn = document.getElementById('create-automation-btn');
    const originalText = createBtn.textContent;

    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    const name = document.getElementById('automation-name').value.trim();
    const description = document.getElementById('automation-description').value.trim();
    const type = document.getElementById('automation-type').value;
    const frequency = document.getElementById('automation-frequency').value;
    const icon = document.getElementById('automation-icon')?.value || 'workflow';
    const targetSegment = document.getElementById('automation-segment')?.value || 'all';

    try {
        const { data, error } = await supabase
            .from('automations')
            .insert([{
                project_id: currentProject.id,
                name,
                description,
                type,
                frequency,
                icon,
                target_segment: targetSegment,
                is_active: false,
                settings: {}
            }])
            .select()
            .single();

        if (error) throw error;

        // Celebrate!
        celebrate();
        createBtn.textContent = 'Created!';

        // Redirect to the new automation after brief celebration
        setTimeout(() => {
            window.location.href = `/app/automation.html#${data.id}`;
        }, 800);

    } catch (error) {
        console.error('Error creating automation:', error);
        alert('Error creating automation. Please try again.');
        createBtn.disabled = false;
        createBtn.textContent = originalText;
    }
}

// ===== Project Icon Picker =====
function initProjectIconPicker() {
    const picker = document.getElementById('project-icon-picker');
    if (!picker || typeof getAllIcons !== 'function') return;

    const icons = getAllIcons();
    picker.innerHTML = icons.map(icon => `
        <div class="icon-picker-item ${icon.key === selectedProjectIcon ? 'selected' : ''}"
             data-icon="${icon.key}"
             title="${icon.name}"
             onclick="selectProjectIcon('${icon.key}')"
             style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer;">
            ${icon.svg}
        </div>
    `).join('');
}

function toggleProjectIconPicker() {
    const picker = document.getElementById('project-icon-picker');
    if (picker) {
        picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
    }
}

function selectProjectIcon(iconKey) {
    selectedProjectIcon = iconKey;
    document.getElementById('automation-icon').value = iconKey;
    updateProjectIconPreview();
    toggleProjectIconPicker();
}

function updateProjectIconPreview() {
    const preview = document.getElementById('project-icon-preview');
    if (preview && typeof getIconSvg === 'function') {
        preview.innerHTML = getIconSvg(selectedProjectIcon);
    }

    // Update picker selection
    document.querySelectorAll('#project-icon-picker .icon-picker-item').forEach(item => {
        if (item.dataset.icon === selectedProjectIcon) {
            item.style.background = 'rgba(99, 102, 241, 0.1)';
            item.style.borderColor = 'var(--color-primary)';
            item.style.color = 'var(--color-primary)';
        } else {
            item.style.background = 'var(--color-bg)';
            item.style.borderColor = 'var(--color-border)';
            item.style.color = 'var(--color-text-secondary)';
        }
    });
}

function handleProjectIconDetection() {
    const name = document.getElementById('automation-name')?.value || '';
    const description = document.getElementById('automation-description')?.value || '';

    if ((name || description) && typeof detectIcon === 'function') {
        selectedProjectIcon = detectIcon(name, description);
        document.getElementById('automation-icon').value = selectedProjectIcon;
        updateProjectIconPreview();
    }
}

window.toggleProjectIconPicker = toggleProjectIconPicker;
window.selectProjectIcon = selectProjectIcon;

// ===== View/Edit Mode Functions =====
function updateDetailsViewMode() {
    const industryLabels = {
        'agnostic': 'Agnostic / All Industries',
        'food': 'Food & Restaurant',
        'health': 'Health & Wellness',
        'service': 'Professional Services',
        'politics': 'Politics & Advocacy',
        'technology': 'Technology',
        'retail': 'Retail & E-commerce',
        'education': 'Education',
        'other': 'Other'
    };

    document.getElementById('view-name').textContent = currentProject.name || '-';
    document.getElementById('view-industry').textContent = industryLabels[currentProject.industry] || currentProject.industry || '-';
    document.getElementById('view-description').textContent = currentProject.description || '-';
    document.getElementById('view-target-market').textContent = currentProject.target_market || '-';
    document.getElementById('view-location').textContent = currentProject.location || '-';
}

function updateContextViewMode() {
    const goalsDisplay = document.getElementById('view-goals');
    const painPointsDisplay = document.getElementById('view-pain-points');
    const competitorsDisplay = document.getElementById('view-competitors');
    const competitiveAdvantageDisplay = document.getElementById('view-competitive-advantage');

    goalsDisplay.innerHTML = projectGoals.length > 0
        ? projectGoals.map(g => `<span class="tag">${escapeHtml(g)}</span>`).join('')
        : '<span class="empty-text">No goals set</span>';

    painPointsDisplay.innerHTML = projectPainPoints.length > 0
        ? projectPainPoints.map(p => `<span class="tag">${escapeHtml(p)}</span>`).join('')
        : '<span class="empty-text">No pain points set</span>';

    competitorsDisplay.innerHTML = projectCompetitors.length > 0
        ? projectCompetitors.map(c => `<span class="tag">${escapeHtml(c)}</span>`).join('')
        : '<span class="empty-text">No competitors set</span>';

    competitiveAdvantageDisplay.textContent = projectCompetitiveAdvantage || '-';
}

function showDetailsEditMode() {
    document.getElementById('details-view-mode').style.display = 'none';
    document.getElementById('project-details-form').style.display = 'block';
    document.getElementById('edit-details-btn').style.display = 'none';
    document.getElementById('details-name').focus();
}

function hideDetailsEditMode() {
    document.getElementById('project-details-form').style.display = 'none';
    document.getElementById('details-view-mode').style.display = 'block';
    document.getElementById('edit-details-btn').style.display = 'inline-flex';

    // Reset form to current values
    document.getElementById('details-name').value = currentProject.name;
    document.getElementById('details-description').value = currentProject.description || '';
    document.getElementById('details-industry').value = currentProject.industry || '';
    document.getElementById('details-target-market').value = currentProject.target_market || '';
    document.getElementById('details-location').value = currentProject.location || '';
}

function showContextEditMode() {
    document.getElementById('context-view-mode').style.display = 'none';
    document.getElementById('context-edit-mode').style.display = 'block';
    document.getElementById('edit-context-btn').style.display = 'none';

    // Populate textareas with current values
    document.getElementById('goals-textarea').value = projectGoals.join('\n');
    document.getElementById('pain-points-textarea').value = projectPainPoints.join('\n');
    document.getElementById('competitors-textarea').value = projectCompetitors.join('\n');
    document.getElementById('competitive-advantage-textarea').value = projectCompetitiveAdvantage;
}

function hideContextEditMode() {
    document.getElementById('context-edit-mode').style.display = 'none';
    document.getElementById('context-view-mode').style.display = 'block';
    document.getElementById('edit-context-btn').style.display = 'inline-flex';
}

function updateAnalyzeButtonState() {
    const btn = document.getElementById('analyze-btn');
    const status = document.getElementById('analysis-status');
    const banner = document.getElementById('incomplete-banner');
    const bannerMessage = document.getElementById('banner-message');

    const hasName = currentProject.name && currentProject.name.trim();
    const hasDescription = currentProject.description && currentProject.description.trim();
    const hasIndustry = currentProject.industry;

    if (hasName && hasDescription && hasIndustry) {
        btn.disabled = false;
        status.textContent = 'Ready to generate AI opportunities';
        status.classList.add('ready');
        // Hide banner when complete
        banner.style.display = 'none';
    } else {
        btn.disabled = true;
        const missing = [];
        if (!hasName) missing.push('name');
        if (!hasDescription) missing.push('description');
        if (!hasIndustry) missing.push('industry');
        status.textContent = `Complete your project ${missing.join(', ')} to enable AI analysis`;
        status.classList.remove('ready');

        // Show banner if not dismissed for this project
        const dismissedKey = `banner_dismissed_${currentProject.id}`;
        if (!localStorage.getItem(dismissedKey)) {
            banner.style.display = 'flex';
            bannerMessage.textContent = `Add your project ${missing.join(', ')} to enable AI analysis`;
        }
    }
}

function showOpportunitiesColumn() {
    document.getElementById('overview-content').classList.add('has-opportunities');
    document.getElementById('overview-right').style.display = 'block';
}

function dismissIncompleteBanner() {
    const banner = document.getElementById('incomplete-banner');
    banner.style.display = 'none';

    // Remember dismissal for this project
    if (currentProject && currentProject.id) {
        localStorage.setItem(`banner_dismissed_${currentProject.id}`, 'true');
    }
}

// ===== Save Project Details =====
async function handleSaveDetails(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('save-details-btn');
    const originalText = saveBtn.textContent;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const name = document.getElementById('details-name').value.trim();
    const description = document.getElementById('details-description').value.trim();
    const industry = document.getElementById('details-industry').value;
    const targetMarket = document.getElementById('details-target-market').value.trim();
    const location = document.getElementById('details-location').value.trim();

    try {
        const { error } = await supabase
            .from('projects')
            .update({
                name,
                description,
                industry: industry || null,
                target_market: targetMarket || null,
                location: location || null
            })
            .eq('id', currentProject.id);

        if (error) throw error;

        // Update page
        document.getElementById('breadcrumb-project').textContent = name;
        document.getElementById('project-title').textContent = name;
        document.getElementById('project-description').textContent = description;

        const industryBadge = document.getElementById('project-industry');
        if (industry) {
            industryBadge.textContent = industry;
            industryBadge.style.display = 'inline-flex';
        } else {
            industryBadge.style.display = 'none';
        }

        currentProject.name = name;
        currentProject.description = description;
        currentProject.industry = industry;
        currentProject.target_market = targetMarket;
        currentProject.location = location;

        // Update view mode and switch back
        updateDetailsViewMode();
        hideDetailsEditMode();
        updateAnalyzeButtonState();

        // Subtle celebration for save
        celebrateSubtle();

    } catch (error) {
        console.error('Error saving details:', error);
        alert('Error saving details. Please try again.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// ===== Business Context =====
async function handleSaveContext() {
    const saveBtn = document.getElementById('save-context-btn');
    const originalText = saveBtn.textContent;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    // Parse textareas (one item per line, filter empty lines)
    projectGoals = document.getElementById('goals-textarea').value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s);
    projectPainPoints = document.getElementById('pain-points-textarea').value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s);
    projectCompetitors = document.getElementById('competitors-textarea').value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s);
    projectCompetitiveAdvantage = document.getElementById('competitive-advantage-textarea').value.trim();

    try {
        const { error } = await supabase
            .from('projects')
            .update({
                goals: projectGoals,
                pain_points: projectPainPoints,
                competitors: projectCompetitors,
                competitive_advantage: projectCompetitiveAdvantage || null
            })
            .eq('id', currentProject.id);

        if (error) throw error;

        currentProject.goals = projectGoals;
        currentProject.pain_points = projectPainPoints;
        currentProject.competitors = projectCompetitors;
        currentProject.competitive_advantage = projectCompetitiveAdvantage;

        // Update view mode and switch back
        updateContextViewMode();
        hideContextEditMode();

        celebrateSubtle();

    } catch (error) {
        console.error('Error saving context:', error);
        alert('Error saving context. Please try again.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// ===== Delete Project =====
function handleDeleteProject() {
    DangerModal.show({
        title: 'Delete Project',
        itemName: currentProject.name,
        warningText: 'This will permanently delete the project and its settings. Automations will be saved as templates for reuse. Customers remain in your organization.',
        confirmPhrase: 'YES DELETE THIS PROJECT',
        confirmButtonText: 'Delete Project',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('projects')
                    .delete()
                    .eq('id', currentProject.id);

                if (error) throw error;

                // Small delay to let flames finish, then redirect
                setTimeout(() => {
                    window.location.href = '/app/dashboard.html';
                }, 500);

            } catch (error) {
                console.error('Error deleting project:', error);
                alert('Error deleting project. Please try again.');
            }
        }
    });
}

// ===== Add Customers Modal =====
async function openCustomersModal() {
    selectedCustomerIds.clear();
    updateSelectedCount();

    document.getElementById('add-customers-modal').classList.add('active');
    document.getElementById('customer-search').value = '';

    // Load organization customers
    await loadSelectableCustomers();
}

function closeCustomersModal() {
    document.getElementById('add-customers-modal').classList.remove('active');
    selectedCustomerIds.clear();
    // Reset to select view
    showSelectCustomersView();
}

async function loadSelectableCustomers() {
    const list = document.getElementById('selectable-customers-list');
    list.innerHTML = '<div class="loading-spinner"></div>';

    try {
        // Get customers already in the project
        const { data: existingPCs } = await supabase
            .from('project_customers')
            .select('customer_id')
            .eq('project_id', currentProject.id);

        const existingIds = new Set(existingPCs?.map(pc => pc.customer_id) || []);

        // Get all organization customers
        const { data: customers, error } = await supabase
            .from('customers')
            .select('*')
            .eq('organization_id', currentProject.organization_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter out customers already in project
        allOrgCustomers = (customers || []).filter(c => !existingIds.has(c.id));

        renderSelectableCustomers(allOrgCustomers);

    } catch (error) {
        console.error('Error loading customers:', error);
        list.innerHTML = '<p style="padding: 24px; color: var(--color-error);">Error loading customers.</p>';
    }
}

function renderSelectableCustomers(customers) {
    const list = document.getElementById('selectable-customers-list');

    if (customers.length === 0) {
        list.innerHTML = '<p style="padding: 24px; text-align: center; color: var(--color-text-muted);">No customers available to add.</p>';
        return;
    }

    list.innerHTML = customers.map(customer => {
        const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unknown';
        const initials = getInitials(customer.first_name, customer.last_name);
        const isSelected = selectedCustomerIds.has(customer.id);

        return `
            <div class="selectable-customer ${isSelected ? 'selected' : ''}" onclick="toggleCustomerSelection('${customer.id}')">
                <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleCustomerSelection('${customer.id}')">
                <span class="customer-avatar">${initials}</span>
                <div class="customer-details">
                    <h4>${escapeHtml(name)}</h4>
                    <p>${escapeHtml(customer.email || customer.company || 'No email')}</p>
                </div>
            </div>
        `;
    }).join('');
}

function filterSelectableCustomers() {
    const search = document.getElementById('customer-search').value.toLowerCase();

    const filtered = allOrgCustomers.filter(c => {
        const name = [c.first_name, c.last_name].filter(Boolean).join(' ').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const company = (c.company || '').toLowerCase();
        return name.includes(search) || email.includes(search) || company.includes(search);
    });

    renderSelectableCustomers(filtered);
}

function toggleCustomerSelection(customerId) {
    if (selectedCustomerIds.has(customerId)) {
        selectedCustomerIds.delete(customerId);
    } else {
        selectedCustomerIds.add(customerId);
    }

    // Update UI
    const card = document.querySelector(`.selectable-customer[onclick*="${customerId}"]`);
    if (card) {
        card.classList.toggle('selected', selectedCustomerIds.has(customerId));
        card.querySelector('input[type="checkbox"]').checked = selectedCustomerIds.has(customerId);
    }

    updateSelectedCount();
}

window.toggleCustomerSelection = toggleCustomerSelection;

function updateSelectedCount() {
    const count = selectedCustomerIds.size;
    document.getElementById('selected-count').textContent = `${count} selected`;
    document.getElementById('add-selected-customers-btn').disabled = count === 0;
}

async function handleAddSelectedCustomers() {
    const btn = document.getElementById('add-selected-customers-btn');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    try {
        const toInsert = Array.from(selectedCustomerIds).map(customerId => ({
            project_id: currentProject.id,
            customer_id: customerId
        }));

        const { error } = await supabase
            .from('project_customers')
            .insert(toInsert);

        if (error) throw error;

        celebrateSubtle();
        closeCustomersModal();
        await loadProjectCustomers(currentProject.id);

    } catch (error) {
        console.error('Error adding customers:', error);
        alert('Error adding customers. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add Selected';
    }
}

// ===== Create New Customer from Project =====
function showCreateCustomerView() {
    document.getElementById('select-customers-view').style.display = 'none';
    document.getElementById('create-customer-view').style.display = 'block';
    document.getElementById('customers-modal-title').textContent = 'Create New Customer';
    document.getElementById('new-customer-form').reset();
    document.getElementById('new-customer-first-name').focus();
}

function showSelectCustomersView() {
    document.getElementById('create-customer-view').style.display = 'none';
    document.getElementById('select-customers-view').style.display = 'block';
    document.getElementById('customers-modal-title').textContent = 'Add Customers to Project';
}

async function handleCreateNewCustomer(e) {
    e.preventDefault();

    const btn = document.getElementById('save-new-customer-btn');
    btn.disabled = true;
    btn.textContent = 'Creating...';

    const customerData = {
        organization_id: currentProject.organization_id,
        first_name: document.getElementById('new-customer-first-name').value.trim() || null,
        last_name: document.getElementById('new-customer-last-name').value.trim() || null,
        email: document.getElementById('new-customer-email').value.trim() || null,
        phone: document.getElementById('new-customer-phone').value.trim() || null,
        company: document.getElementById('new-customer-company').value.trim() || null,
        source: 'manual'
    };

    try {
        // Create customer in organization
        const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert([customerData])
            .select()
            .single();

        if (customerError) throw customerError;

        // Add customer to this project
        const { error: projectError } = await supabase
            .from('project_customers')
            .insert([{
                project_id: currentProject.id,
                customer_id: newCustomer.id
            }]);

        if (projectError) throw projectError;

        celebrate();
        closeCustomersModal();
        await loadProjectCustomers(currentProject.id);

    } catch (error) {
        console.error('Error creating customer:', error);
        alert('Error creating customer. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create & Add to Project';
    }
}

// ===== AI Diagnosis Functions =====
async function runProjectDiagnosis() {
    const btn = document.getElementById('run-diagnosis-btn');
    const loading = document.getElementById('diagnosis-loading');
    const results = document.getElementById('diagnosis-results');

    // Show loading state
    btn.disabled = true;
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="spin">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="25 25"/>
        </svg>
        Analyzing...
    `;
    loading.style.display = 'flex';
    results.style.display = 'none';

    // Generate suggestions based on project context
    const suggestions = generateDiagnosisSuggestions();

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Render suggestions
    renderDiagnosisSuggestions(suggestions);

    // Hide loading, show results
    loading.style.display = 'none';
    results.style.display = 'flex';

    // Reset button
    btn.disabled = false;
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M18 2L10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13 2H18V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Refresh Suggestions
    `;
}

function generateDiagnosisSuggestions() {
    const industry = currentProject?.industry || 'agnostic';
    const goals = currentProject?.goals || [];
    const painPoints = currentProject?.pain_points || [];

    // Base suggestions applicable to all industries
    const baseSuggestions = [
        {
            name: 'Welcome New Customers',
            description: 'Automatically send a warm welcome message to new customers, introducing them to your brand and key offerings.',
            icon: 'welcome',
            type: 'email',
            segment: 'New customers',
            reasoning: 'A strong first impression increases customer lifetime value and engagement.'
        },
        {
            name: 'Birthday Celebration',
            description: 'Delight customers on their special day with personalized birthday greetings and exclusive offers.',
            icon: 'birthday',
            type: 'email',
            segment: 'Customers with birthdays',
            reasoning: 'Birthday campaigns have 481% higher transaction rates than promotional emails.'
        },
        {
            name: 'Win-Back Inactive Customers',
            description: 'Re-engage customers who haven\'t interacted in 30+ days with personalized offers to bring them back.',
            icon: 'win_back',
            type: 'email',
            segment: 'Inactive customers',
            reasoning: 'Acquiring new customers costs 5x more than retaining existing ones.'
        }
    ];

    // Industry-specific suggestions
    const industrySuggestions = {
        food: [
            {
                name: 'Happy Hour Alerts',
                description: 'Notify nearby customers about daily specials, happy hour deals, and limited-time menu items.',
                icon: 'promotion',
                type: 'email',
                segment: 'Local customers',
                reasoning: 'Timely promotions drive same-day foot traffic and increase average order value.'
            },
            {
                name: 'Loyalty Rewards Update',
                description: 'Keep customers engaged by updating them on their loyalty points and available rewards.',
                icon: 'loyalty',
                type: 'email',
                segment: 'Loyalty members',
                reasoning: 'Loyalty program members spend 67% more than non-members.'
            }
        ],
        health: [
            {
                name: 'Appointment Reminders',
                description: 'Reduce no-shows by sending automated reminders before scheduled appointments.',
                icon: 'appointment',
                type: 'email',
                segment: 'Scheduled patients',
                reasoning: 'Automated reminders can reduce no-show rates by up to 38%.'
            },
            {
                name: 'Health Tips Newsletter',
                description: 'Share valuable health tips, wellness advice, and seasonal health information.',
                icon: 'education',
                type: 'email',
                segment: 'All patients',
                reasoning: 'Educational content builds trust and positions you as a health authority.'
            }
        ],
        service: [
            {
                name: 'Renewal Reminders',
                description: 'Notify clients before their contract or subscription is about to expire.',
                icon: 'renewal',
                type: 'email',
                segment: 'Expiring contracts',
                reasoning: 'Proactive renewal outreach improves retention rates by 20%.'
            },
            {
                name: 'Post-Service Follow-up',
                description: 'Check in after service delivery to ensure satisfaction and gather feedback.',
                icon: 'follow_up',
                type: 'email',
                segment: 'Recent clients',
                reasoning: 'Follow-up increases referral likelihood and identifies issues early.'
            }
        ],
        retail: [
            {
                name: 'Abandoned Cart Recovery',
                description: 'Remind customers about items left in their cart with a gentle nudge to complete their purchase.',
                icon: 'cart',
                type: 'email',
                segment: 'Cart abandoners',
                reasoning: 'Cart recovery emails have a 45% open rate and 21% click-through rate.'
            },
            {
                name: 'Product Review Request',
                description: 'Ask satisfied customers to leave reviews after their purchase.',
                icon: 'feedback',
                type: 'email',
                segment: 'Recent purchasers',
                reasoning: '93% of consumers read reviews before making a purchase decision.'
            }
        ]
    };

    // Combine base and industry suggestions
    let suggestions = [...baseSuggestions];
    if (industrySuggestions[industry]) {
        suggestions = [...suggestions, ...industrySuggestions[industry]];
    }

    // Shuffle and limit to 3-5 suggestions
    suggestions = shuffleArray(suggestions).slice(0, Math.min(5, Math.max(3, suggestions.length)));

    return suggestions;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function renderDiagnosisSuggestions(suggestions) {
    const container = document.getElementById('diagnosis-results');

    container.innerHTML = suggestions.map((suggestion, index) => `
        <div class="diagnosis-card" data-index="${index}">
            <div class="diagnosis-card-header">
                <div class="diagnosis-card-icon">
                    ${typeof getIconSvg === 'function' ? getIconSvg(suggestion.icon) : ''}
                </div>
                <div class="diagnosis-card-info">
                    <div class="diagnosis-card-title">${escapeHtml(suggestion.name)}</div>
                    <div class="diagnosis-card-segment">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="5" r="2" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M3 12C3 9.79 4.79 8 7 8C9.21 8 11 9.79 11 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        ${escapeHtml(suggestion.segment)}
                    </div>
                </div>
            </div>
            <div class="diagnosis-card-desc">${escapeHtml(suggestion.description)}</div>
            <div style="font-size: 13px; color: var(--color-text-muted); background: var(--color-bg-secondary); padding: 10px 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
                <strong>Why this matters:</strong> ${escapeHtml(suggestion.reasoning)}
            </div>
            <div class="diagnosis-card-actions">
                <button class="btn-create-diagnosis" onclick="createFromDiagnosis(${index})">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Create Automation
                </button>
                <button class="btn-dismiss-diagnosis" onclick="dismissDiagnosis(${index})">Dismiss</button>
            </div>
        </div>
    `).join('');

    // Store suggestions for later use
    window.diagnosisSuggestions = suggestions;
}

async function createFromDiagnosis(index) {
    const suggestion = window.diagnosisSuggestions?.[index];
    if (!suggestion) return;

    // Pre-fill the automation modal with the suggestion
    document.getElementById('automation-name').value = suggestion.name;
    document.getElementById('automation-description').value = suggestion.description;

    // Try to detect and set type
    const typeSelect = document.getElementById('automation-type');
    if (typeSelect) {
        const type = suggestion.type === 'email' ? 'email' : 'blog_generation';
        // Check if option exists and is not disabled
        const option = typeSelect.querySelector(`option[value="${type}"]`);
        if (option && !option.disabled) {
            typeSelect.value = type;
        }
    }

    // Open the modal
    openAutomationModal();

    // Celebrate the choice
    if (typeof celebrateSubtle === 'function') {
        celebrateSubtle();
    }
}

function dismissDiagnosis(index) {
    const card = document.querySelector(`.diagnosis-card[data-index="${index}"]`);
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        setTimeout(() => card.remove(), 300);
    }

    // Update stored suggestions
    if (window.diagnosisSuggestions) {
        window.diagnosisSuggestions.splice(index, 1);
    }
}

window.createFromDiagnosis = createFromDiagnosis;
window.dismissDiagnosis = dismissDiagnosis;

// ===== Utility Functions =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initProject);
