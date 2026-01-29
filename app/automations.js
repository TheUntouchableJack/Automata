// ===== Automations Page =====
let currentUser = null;
let currentOrganization = null;
let allAutomations = [];
let allProjects = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedIcon = 'workflow';
let selectedTemplateId = null;

async function initAutomations() {
    // Require authentication
    currentUser = await requireAuth();
    if (!currentUser) return;

    // Load user info
    await loadUserInfo();

    // Load organization
    await loadOrganization();

    // Load projects for the dropdown
    await loadProjects();

    // Load automations
    await loadAutomations();

    // Setup event listeners
    setupEventListeners();

    // Populate templates grid
    populateTemplatesGrid();

    // Populate icon picker
    populateIconPicker();
}

// ===== Load Organization =====
async function loadOrganization() {
    try {
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

// ===== Load Projects =====
async function loadProjects() {
    if (!currentOrganization) return;

    try {
        const { data: projects, error } = await supabase
            .from('projects')
            .select('id, name, industry')
            .eq('organization_id', currentOrganization.id)
            .order('name');

        if (error) throw error;

        allProjects = projects || [];

        // Populate project dropdowns
        populateProjectDropdowns();
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function populateProjectDropdowns() {
    const scratchSelect = document.getElementById('scratch-project');
    const templateSelect = document.getElementById('template-project');

    const options = allProjects.map(p =>
        `<option value="${p.id}">${escapeHtml(p.name)}</option>`
    ).join('');

    if (scratchSelect) {
        scratchSelect.innerHTML = '<option value="">Select a project</option>' + options;
    }
    if (templateSelect) {
        templateSelect.innerHTML = '<option value="">Select a project</option>' + options;
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

// ===== Load Automations =====
async function loadAutomations() {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('automations-grid');
    const emptyState = document.getElementById('empty-state');

    if (!currentOrganization) {
        loading.innerHTML = '<p style="color: var(--color-error);">No organization found.</p>';
        return;
    }

    try {
        // Load all automations for the organization via projects
        const { data: automations, error } = await supabase
            .from('automations')
            .select(`
                *,
                projects (
                    id,
                    name,
                    industry
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allAutomations = automations || [];

        loading.style.display = 'none';
        updateCounts();
        renderAutomations();

    } catch (error) {
        console.error('Error loading automations:', error);
        loading.innerHTML = '<p style="color: var(--color-error);">Error loading automations.</p>';
    }
}

// ===== Update Filter Counts =====
function updateCounts() {
    const activeCount = allAutomations.filter(a => a.is_active && !a.is_archived).length;
    const inactiveCount = allAutomations.filter(a => !a.is_active && !a.is_archived).length;
    const archivedCount = allAutomations.filter(a => a.is_archived).length;
    const allCount = allAutomations.filter(a => !a.is_archived).length;

    document.getElementById('count-all').textContent = allCount;
    document.getElementById('count-active').textContent = activeCount;
    document.getElementById('count-inactive').textContent = inactiveCount;
    document.getElementById('count-archived').textContent = archivedCount;
}

// ===== Render Automations =====
function renderAutomations() {
    const grid = document.getElementById('automations-grid');
    const emptyState = document.getElementById('empty-state');

    // Filter automations
    let filtered = allAutomations;

    // Apply status filter
    switch (currentFilter) {
        case 'active':
            filtered = filtered.filter(a => a.is_active && !a.is_archived);
            break;
        case 'inactive':
            filtered = filtered.filter(a => !a.is_active && !a.is_archived);
            break;
        case 'archived':
            filtered = filtered.filter(a => a.is_archived);
            break;
        default: // 'all'
            filtered = filtered.filter(a => !a.is_archived);
    }

    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(a =>
            a.name.toLowerCase().includes(query) ||
            (a.description && a.description.toLowerCase().includes(query)) ||
            (a.projects?.name && a.projects.name.toLowerCase().includes(query))
        );
    }

    if (filtered.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        updateEmptyState();
        return;
    }

    emptyState.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = filtered.map(automation => {
        const isArchived = automation.is_archived;
        const statusClass = isArchived ? 'archived' : (automation.is_active ? 'active' : 'inactive');
        const statusText = isArchived ? 'Archived' : (automation.is_active ? 'Active' : 'Inactive');
        const projectName = automation.projects?.name || 'No Project';
        const description = automation.description || `${formatType(automation.type)} automation running ${formatFrequency(automation.frequency).toLowerCase()}.`;

        const typeIcon = getAutomationIcon(automation);

        return `
            <div class="automation-card ${isArchived ? 'archived' : ''}" data-id="${automation.id}">
                ${isArchived ? `
                    <a href="javascript:void(0)" class="btn-action" onclick="restoreAutomation('${automation.id}')">Restore</a>
                ` : `
                    <a href="/app/automation.html#${automation.id}" class="btn-action">Open</a>
                `}
                <div class="automation-card-icon">
                    ${typeIcon}
                </div>
                <span class="automation-card-badge ${statusClass}">${statusText}</span>
                <h3 class="automation-card-title">${escapeHtml(automation.name)}</h3>
                <p class="automation-card-desc">${escapeHtml(description)}</p>
                <div class="automation-card-meta">
                    <span class="automation-card-project">${escapeHtml(projectName)}</span>
                    <span class="automation-card-frequency">${formatFrequency(automation.frequency)}</span>
                    <div class="automation-card-actions">
                        ${isArchived ? `
                            <button class="btn-secondary-action delete" onclick="deleteAutomation('${automation.id}', '${escapeHtml(automation.name).replace(/'/g, "\\'")}')">Delete</button>
                        ` : `
                            <button class="btn-secondary-action archive" onclick="archiveAutomation('${automation.id}')">Archive</button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getAutomationIcon(automation) {
    // Use the icon field if available, otherwise fall back to type-based icon
    if (automation.icon && typeof getIconSvg === 'function') {
        return getIconSvg(automation.icon);
    }

    // Fallback to type-based icons
    const icons = {
        'blog_generation': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M8 9H16M8 13H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        'email': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M3 7L12 13L21 7" stroke="currentColor" stroke-width="2"/>
        </svg>`,
        'workflow': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="6" r="3" stroke="currentColor" stroke-width="2"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
            <circle cx="18" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M12 9V12M12 12L6 15M12 12L18 15" stroke="currentColor" stroke-width="2"/>
        </svg>`
    };
    return icons[automation.type] || icons['blog_generation'];
}

function formatFrequency(freq) {
    const frequencies = {
        'daily': 'Daily',
        'weekly': 'Weekly',
        'monthly': 'Monthly'
    };
    return frequencies[freq] || freq || 'Manual';
}

function formatType(type) {
    const types = {
        'blog_generation': 'Blog Generation',
        'email': 'Email',
        'workflow': 'Workflow'
    };
    return types[type] || type || 'Automation';
}

function updateEmptyState() {
    const title = document.getElementById('empty-title');
    const message = document.getElementById('empty-message');

    switch (currentFilter) {
        case 'active':
            title.textContent = 'No active automations';
            message.textContent = 'Activate an automation from its settings page.';
            break;
        case 'inactive':
            title.textContent = 'No inactive automations';
            message.textContent = 'All your automations are currently active!';
            break;
        case 'archived':
            title.textContent = 'No archived automations';
            message.textContent = 'Archived automations will appear here.';
            break;
        default:
            title.textContent = searchQuery ? 'No automations found' : 'No automations yet';
            message.textContent = searchQuery ? 'Try a different search term.' : 'Create your first automation from a project.';
    }
}

// ===== Archive Automation =====
async function archiveAutomation(id) {
    try {
        const { error } = await supabase
            .from('automations')
            .update({ is_archived: true })
            .eq('id', id);

        if (error) throw error;

        // Update local data
        const automation = allAutomations.find(a => a.id === id);
        if (automation) automation.is_archived = true;

        updateCounts();
        renderAutomations();

    } catch (error) {
        console.error('Error archiving automation:', error);
        alert('Error archiving automation. Please try again.');
    }
}

window.archiveAutomation = archiveAutomation;

// ===== Restore Automation =====
async function restoreAutomation(id) {
    try {
        const { error } = await supabase
            .from('automations')
            .update({ is_archived: false })
            .eq('id', id);

        if (error) throw error;

        // Update local data
        const automation = allAutomations.find(a => a.id === id);
        if (automation) automation.is_archived = false;

        updateCounts();
        renderAutomations();
        celebrate({ intensity: 'subtle' });

    } catch (error) {
        console.error('Error restoring automation:', error);
        alert('Error restoring automation. Please try again.');
    }
}

window.restoreAutomation = restoreAutomation;

// ===== Delete Automation (Permanent) =====
function deleteAutomation(id, name) {
    DangerModal.show({
        title: 'Delete Automation',
        itemName: name,
        warningText: 'This will permanently delete this automation and all its generated content. This action cannot be undone.',
        confirmPhrase: 'YES DELETE THIS AUTOMATION',
        confirmButtonText: 'Delete Forever',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('automations')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                // Remove from local data
                allAutomations = allAutomations.filter(a => a.id !== id);

                updateCounts();
                renderAutomations();

            } catch (error) {
                console.error('Error deleting automation:', error);
                alert('Error deleting automation. Please try again.');
            }
        }
    });
}

window.deleteAutomation = deleteAutomation;

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

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderAutomations();
        });
    });

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderAutomations();
    });

    // New Automation button
    document.getElementById('new-automation-btn')?.addEventListener('click', openCreationModal);

    // Modal close buttons
    document.getElementById('automation-modal-close')?.addEventListener('click', closeCreationModal);
    document.getElementById('automation-modal-close-scratch')?.addEventListener('click', closeCreationModal);
    document.getElementById('automation-modal-close-template')?.addEventListener('click', closeCreationModal);
    document.getElementById('automation-modal-close-customize')?.addEventListener('click', closeCreationModal);

    // Cancel buttons
    document.getElementById('cancel-scratch-btn')?.addEventListener('click', closeCreationModal);
    document.getElementById('cancel-template-btn')?.addEventListener('click', closeCreationModal);

    // Path selection
    document.getElementById('path-scratch')?.addEventListener('click', showFromScratchStep);
    document.getElementById('path-template')?.addEventListener('click', showFromTemplateStep);

    // Back buttons
    document.getElementById('back-to-path-scratch')?.addEventListener('click', showChoosePathStep);
    document.getElementById('back-to-path-template')?.addEventListener('click', showChoosePathStep);
    document.getElementById('back-to-templates')?.addEventListener('click', showFromTemplateStep);

    // Form submissions
    document.getElementById('create-scratch-form')?.addEventListener('submit', handleCreateFromScratch);
    document.getElementById('create-template-form')?.addEventListener('submit', handleCreateFromTemplate);

    // Icon detection on name/description change
    document.getElementById('scratch-name')?.addEventListener('blur', handleIconDetection);
    document.getElementById('scratch-description')?.addEventListener('blur', handleIconDetection);

    // Icon preview click to show picker
    document.getElementById('scratch-icon-preview')?.addEventListener('click', toggleIconPicker);

    // Close modal on overlay click
    document.getElementById('create-automation-modal')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeCreationModal();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCreationModal();
        }
    });
}

// ===== Creation Modal Functions =====
function openCreationModal() {
    showChoosePathStep();
    document.getElementById('create-automation-modal').classList.add('active');
}

function closeCreationModal() {
    document.getElementById('create-automation-modal').classList.remove('active');
    resetCreationModal();
}

function resetCreationModal() {
    // Reset forms
    document.getElementById('create-scratch-form')?.reset();
    document.getElementById('create-template-form')?.reset();

    // Reset icon
    selectedIcon = 'workflow';
    updateIconPreview();

    // Hide icon picker
    const iconPicker = document.getElementById('scratch-icon-picker');
    if (iconPicker) iconPicker.style.display = 'none';

    // Reset template selection
    selectedTemplateId = null;
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
}

function showChoosePathStep() {
    document.getElementById('step-choose-path').style.display = 'block';
    document.getElementById('step-from-scratch').style.display = 'none';
    document.getElementById('step-from-template').style.display = 'none';
    document.getElementById('step-customize-template').style.display = 'none';
}

function showFromScratchStep() {
    document.getElementById('step-choose-path').style.display = 'none';
    document.getElementById('step-from-scratch').style.display = 'block';
    document.getElementById('step-from-template').style.display = 'none';
    document.getElementById('step-customize-template').style.display = 'none';
    document.getElementById('scratch-name')?.focus();
}

function showFromTemplateStep() {
    document.getElementById('step-choose-path').style.display = 'none';
    document.getElementById('step-from-scratch').style.display = 'none';
    document.getElementById('step-from-template').style.display = 'block';
    document.getElementById('step-customize-template').style.display = 'none';
}

function showCustomizeTemplateStep() {
    document.getElementById('step-choose-path').style.display = 'none';
    document.getElementById('step-from-scratch').style.display = 'none';
    document.getElementById('step-from-template').style.display = 'none';
    document.getElementById('step-customize-template').style.display = 'block';
}

// ===== Icon Functions =====
function handleIconDetection() {
    const name = document.getElementById('scratch-name')?.value || '';
    const description = document.getElementById('scratch-description')?.value || '';

    if (name || description) {
        selectedIcon = detectIcon(name, description);
        updateIconPreview();
        document.getElementById('scratch-icon').value = selectedIcon;
    }
}

function updateIconPreview() {
    const preview = document.getElementById('scratch-icon-preview');
    if (preview && typeof getIconSvg === 'function') {
        preview.innerHTML = getIconSvg(selectedIcon);
    }

    // Update picker selection
    document.querySelectorAll('.icon-picker-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.icon === selectedIcon);
    });
}

function toggleIconPicker() {
    const picker = document.getElementById('scratch-icon-picker');
    if (picker) {
        picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
    }
}

function populateIconPicker() {
    const picker = document.getElementById('scratch-icon-picker');
    if (!picker || typeof getAllIcons !== 'function') return;

    const icons = getAllIcons();
    picker.innerHTML = icons.map(icon => `
        <div class="icon-picker-item ${icon.key === selectedIcon ? 'selected' : ''}"
             data-icon="${icon.key}"
             title="${icon.name}"
             onclick="selectIcon('${icon.key}')">
            ${icon.svg}
        </div>
    `).join('');
}

function selectIcon(iconKey) {
    selectedIcon = iconKey;
    document.getElementById('scratch-icon').value = iconKey;
    updateIconPreview();
    toggleIconPicker();
}

window.selectIcon = selectIcon;

// ===== Templates Functions =====
function populateTemplatesGrid() {
    const grid = document.getElementById('templates-grid');
    if (!grid || typeof getAllTemplates !== 'function') return;

    const templates = getAllTemplates();
    grid.innerHTML = templates.map(template => `
        <div class="template-card" data-template-id="${template.id}" onclick="selectTemplate('${template.id}')">
            <div class="template-card-icon">
                ${typeof getIconSvg === 'function' ? getIconSvg(template.icon) : ''}
            </div>
            <div class="template-card-name">${escapeHtml(template.name)}</div>
            <div class="template-card-desc">${escapeHtml(template.description)}</div>
            <div class="template-card-meta">
                <span class="template-meta-badge">${template.type}</span>
                <span class="template-meta-badge">${template.frequency}</span>
            </div>
        </div>
    `).join('');
}

function selectTemplate(templateId) {
    selectedTemplateId = templateId;

    // Update selection UI
    document.querySelectorAll('.template-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.templateId === templateId);
    });

    // Get template details
    const template = typeof getTemplateById === 'function' ? getTemplateById(templateId) : null;
    if (!template) return;

    // Populate customize form
    document.getElementById('template-id').value = template.id;
    document.getElementById('template-name').value = template.name;
    document.getElementById('template-type').value = template.type;
    document.getElementById('template-frequency').value = template.frequency;
    document.getElementById('template-icon').value = template.icon;
    document.getElementById('template-description').value = template.description;

    // Set target segment
    const segmentSelect = document.getElementById('template-segment');
    if (segmentSelect && template.targetSegment) {
        if (template.targetSegment === 'all' || template.targetSegment === 'project') {
            segmentSelect.value = template.targetSegment;
        } else {
            segmentSelect.value = 'all';
        }
    }

    // Update preview
    document.getElementById('template-preview-icon').innerHTML =
        typeof getIconSvg === 'function' ? getIconSvg(template.icon) : '';
    document.getElementById('template-preview-name').textContent = template.name;
    document.getElementById('template-preview-desc').textContent = template.description;

    // Show customize step
    showCustomizeTemplateStep();
}

window.selectTemplate = selectTemplate;

// ===== Create Automation Handlers =====
async function handleCreateFromScratch(e) {
    e.preventDefault();

    const btn = document.getElementById('create-scratch-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Creating...';

    const projectId = document.getElementById('scratch-project').value;
    const name = document.getElementById('scratch-name').value.trim();
    const description = document.getElementById('scratch-description').value.trim();
    const type = document.getElementById('scratch-type').value;
    const frequency = document.getElementById('scratch-frequency').value;
    const targetSegment = document.getElementById('scratch-segment').value;
    const icon = document.getElementById('scratch-icon').value || 'workflow';

    try {
        const { data, error } = await supabase
            .from('automations')
            .insert([{
                project_id: projectId,
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

        // Celebrate and redirect
        if (typeof celebrate === 'function') celebrate();
        btn.textContent = 'Created!';

        setTimeout(() => {
            window.location.href = `/app/automation.html#${data.id}`;
        }, 800);

    } catch (error) {
        console.error('Error creating automation:', error);
        alert('Error creating automation. Please try again.');
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function handleCreateFromTemplate(e) {
    e.preventDefault();

    const btn = document.getElementById('create-template-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Creating...';

    const projectId = document.getElementById('template-project').value;
    const name = document.getElementById('template-name').value.trim();
    const description = document.getElementById('template-description').value;
    const type = document.getElementById('template-type').value;
    const frequency = document.getElementById('template-frequency').value;
    const icon = document.getElementById('template-icon').value;
    const templateId = document.getElementById('template-id').value;
    const targetSegment = document.getElementById('template-segment').value;

    try {
        const { data, error } = await supabase
            .from('automations')
            .insert([{
                project_id: projectId,
                name,
                description,
                type,
                frequency,
                icon,
                template_id: templateId,
                target_segment: targetSegment,
                is_active: false,
                settings: {}
            }])
            .select()
            .single();

        if (error) throw error;

        // Celebrate and redirect
        if (typeof celebrate === 'function') celebrate();
        btn.textContent = 'Created!';

        setTimeout(() => {
            window.location.href = `/app/automation.html#${data.id}`;
        }, 800);

    } catch (error) {
        console.error('Error creating automation:', error);
        alert('Error creating automation. Please try again.');
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// ===== Utility Functions =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAutomations);
