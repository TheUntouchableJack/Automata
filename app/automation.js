// ===== Automation Page Initialization =====
let currentUser = null;
let currentAutomation = null;
let currentProject = null;
let blogSettings = {
    tone: 'professional',
    length: 'medium',
    industries: [],
    keywords: []
};

async function initAutomation() {
    // Require authentication
    currentUser = await requireAuth();
    if (!currentUser) return;

    // Get automation ID from URL hash (fallback to query param for compatibility)
    let automationId = window.location.hash.slice(1); // Remove the # prefix
    if (!automationId) {
        // Fallback to query param
        const urlParams = new URLSearchParams(window.location.search);
        automationId = urlParams.get('id');
    }

    if (!automationId) {
        window.location.href = '/app/dashboard.html';
        return;
    }

    // Load user info
    await loadUserInfo();

    // Load automation
    await loadAutomation(automationId);

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

// ===== Load Automation =====
async function loadAutomation(automationId) {
    const loading = document.getElementById('loading');

    try {
        // Load automation with project info (RLS handles authorization via organization membership)
        const { data: automation, error } = await supabase
            .from('automations')
            .select(`
                *,
                projects (
                    id,
                    name,
                    industry
                )
            `)
            .eq('id', automationId)
            .single();

        if (error || !automation) {
            console.error('Automation not found or access denied:', error);
            window.location.href = '/app/dashboard.html';
            return;
        }

        currentAutomation = automation;
        currentProject = automation.projects;

        // Parse blog settings from JSONB
        if (automation.settings) {
            blogSettings = {
                tone: automation.settings.tone || 'professional',
                length: automation.settings.length || 'medium',
                industries: automation.settings.industries || [],
                keywords: automation.settings.keywords || []
            };
        }

        // Update page with automation info
        document.getElementById('breadcrumb-project').textContent = currentProject.name;
        document.getElementById('breadcrumb-project').href = `/app/project.html#${currentProject.id}`;
        document.getElementById('breadcrumb-automation').textContent = automation.name;
        document.getElementById('automation-title').textContent = automation.name;
        document.getElementById('automation-description').textContent = automation.description || '';

        // Update status badge
        updateStatusBadge(automation.is_active);

        // Set toggle state
        document.getElementById('automation-toggle').checked = automation.is_active;

        // Populate settings form
        document.getElementById('settings-name').value = automation.name;
        document.getElementById('settings-description').value = automation.description || '';
        document.getElementById('settings-frequency').value = automation.frequency;

        // Populate blog settings
        document.getElementById('settings-tone').value = blogSettings.tone;
        document.getElementById('settings-length').value = blogSettings.length;

        // Render tags
        renderTags('industries-input', blogSettings.industries, 'industry');
        renderTags('keywords-input', blogSettings.keywords, 'keyword');

        // Load posts
        await loadPosts(automationId);

        loading.style.display = 'none';
        document.getElementById('posts-tab').style.display = 'block';

    } catch (error) {
        console.error('Error loading automation:', error);
        loading.innerHTML = '<p style="color: var(--color-error);">Error loading automation. Please refresh.</p>';
    }
}

function updateStatusBadge(isActive) {
    const badge = document.getElementById('status-badge');
    const statusText = document.getElementById('status-text');

    if (isActive) {
        badge.classList.remove('inactive');
        badge.classList.add('active');
        statusText.textContent = 'Active';
    } else {
        badge.classList.remove('active');
        badge.classList.add('inactive');
        statusText.textContent = 'Inactive';
    }
}

// ===== Load Posts =====
async function loadPosts(automationId) {
    const postsList = document.getElementById('posts-list');
    const emptyPosts = document.getElementById('empty-posts');

    try {
        const { data: posts, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('automation_id', automationId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!posts || posts.length === 0) {
            postsList.style.display = 'none';
            emptyPosts.style.display = 'block';
            return;
        }

        emptyPosts.style.display = 'none';
        postsList.style.display = 'flex';
        renderPosts(posts);

    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

function renderPosts(posts) {
    const postsList = document.getElementById('posts-list');

    postsList.innerHTML = posts.map(post => {
        const createdDate = new Date(post.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `
            <div class="post-item">
                <div class="post-info">
                    <div class="post-title">${escapeHtml(post.title)}</div>
                    <div class="post-meta">
                        <span class="post-status ${post.status}">${post.status}</span>
                        <span>${createdDate}</span>
                        ${post.industry ? `<span>${post.industry}</span>` : ''}
                    </div>
                </div>
                <div class="post-actions">
                    ${post.status === 'draft' ? `
                        <button class="btn btn-small btn-secondary" onclick="publishPost('${post.id}')">Publish</button>
                    ` : `
                        <a href="/blog/post.html#${post.slug}" target="_blank" class="btn btn-small btn-secondary">View</a>
                    `}
                    <button class="btn btn-small btn-ghost" onclick="deletePost('${post.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Tags Input =====
function renderTags(containerId, tags, type) {
    const container = document.getElementById(containerId);
    const input = container.querySelector('input');

    // Remove existing tags
    container.querySelectorAll('.keyword-tag').forEach(tag => tag.remove());

    // Add tags before input
    tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'keyword-tag';

        const textNode = document.createTextNode(tag + ' ');
        tagEl.appendChild(textNode);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
        removeBtn.addEventListener('click', () => removeTag(containerId, tag, type));
        tagEl.appendChild(removeBtn);

        container.insertBefore(tagEl, input);
    });
}

function addTag(containerId, value, type) {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (type === 'industry') {
        if (!blogSettings.industries.includes(trimmed)) {
            blogSettings.industries.push(trimmed);
            renderTags(containerId, blogSettings.industries, type);
        }
    } else {
        if (!blogSettings.keywords.includes(trimmed)) {
            blogSettings.keywords.push(trimmed);
            renderTags(containerId, blogSettings.keywords, type);
        }
    }
}

function removeTag(containerId, value, type) {
    if (type === 'industry') {
        blogSettings.industries = blogSettings.industries.filter(t => t !== value);
        renderTags(containerId, blogSettings.industries, type);
    } else {
        blogSettings.keywords = blogSettings.keywords.filter(t => t !== value);
        renderTags(containerId, blogSettings.keywords, type);
    }
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

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Automation toggle
    document.getElementById('automation-toggle').addEventListener('change', async (e) => {
        await toggleAutomation(e.target.checked);
    });

    // Generate button
    document.getElementById('generate-btn').addEventListener('click', handleGenerate);

    // Settings forms
    document.getElementById('automation-settings-form').addEventListener('submit', handleSaveDetails);
    document.getElementById('blog-settings-form').addEventListener('submit', handleSaveBlogSettings);

    // Delete automation
    // Note: Delete functionality moved to Manage Automations page
    // document.getElementById('delete-automation-btn')?.addEventListener('click', handleDeleteAutomation);

    // Tag inputs
    document.getElementById('industry-field').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag('industries-input', e.target.value, 'industry');
            e.target.value = '';
        }
    });

    document.getElementById('keyword-field').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag('keywords-input', e.target.value, 'keyword');
            e.target.value = '';
        }
    });

    // Click on container focuses input
    document.getElementById('industries-input').addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            document.getElementById('industry-field').focus();
        }
    });

    document.getElementById('keywords-input').addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            document.getElementById('keyword-field').focus();
        }
    });
}

// ===== Tab Switching =====
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    document.getElementById('posts-tab').style.display = tabName === 'posts' ? 'block' : 'none';
    document.getElementById('settings-tab').style.display = tabName === 'settings' ? 'block' : 'none';
}

// ===== Toggle Automation =====
async function toggleAutomation(isActive) {
    try {
        const { error } = await supabase
            .from('automations')
            .update({ is_active: isActive })
            .eq('id', currentAutomation.id);

        if (error) throw error;

        currentAutomation.is_active = isActive;
        updateStatusBadge(isActive);

    } catch (error) {
        console.error('Error toggling automation:', error);
        alert('Error updating automation. Please try again.');
        document.getElementById('automation-toggle').checked = !isActive;
    }
}

// ===== Generate Post (Placeholder) =====
async function handleGenerate() {
    const generateBtn = document.getElementById('generate-btn');
    const originalText = generateBtn.innerHTML;

    generateBtn.disabled = true;
    generateBtn.innerHTML = `
        <svg class="spinner" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="40" stroke-dashoffset="10">
                <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="1s" repeatCount="indefinite"/>
            </circle>
        </svg>
        Generating...
    `;

    try {
        // For now, create a placeholder post
        const title = `Automation Ideas for ${currentProject.name} - ${new Date().toLocaleDateString()}`;
        const slug = generateSlug(title);

        const { data, error } = await supabase
            .from('blog_posts')
            .insert([{
                automation_id: currentAutomation.id,
                title,
                slug,
                content: `# ${title}\n\nThis is a placeholder post. AI content generation coming soon!\n\n## Introduction\n\nContent will be generated based on your settings and industry preferences.`,
                industry: currentProject.industry,
                seo_keywords: blogSettings.keywords,
                status: 'draft'
            }])
            .select()
            .single();

        if (error) throw error;

        // Update last run time
        await supabase
            .from('automations')
            .update({ last_run_at: new Date().toISOString() })
            .eq('id', currentAutomation.id);

        // Reload posts
        await loadPosts(currentAutomation.id);

        alert('Post generated! (Placeholder - AI integration coming soon)');

    } catch (error) {
        console.error('Error generating post:', error);
        alert('Error generating post. Please try again.');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalText;
    }
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);
}

// ===== Publish Post =====
async function publishPost(postId) {
    try {
        const { error } = await supabase
            .from('blog_posts')
            .update({
                status: 'published',
                published_at: new Date().toISOString()
            })
            .eq('id', postId);

        if (error) throw error;

        await loadPosts(currentAutomation.id);

    } catch (error) {
        console.error('Error publishing post:', error);
        alert('Error publishing post. Please try again.');
    }
}

window.publishPost = publishPost;

// ===== Delete Post =====
function deletePost(postId) {
    DangerModal.show({
        title: 'Delete Blog Post',
        itemName: 'This blog post',
        warningText: 'This will permanently delete this blog post. This action cannot be undone.',
        confirmPhrase: 'YES DELETE THIS POST',
        confirmButtonText: 'Delete Post',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('blog_posts')
                    .delete()
                    .eq('id', postId);

                if (error) throw error;

                await loadPosts(currentAutomation.id);

            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Error deleting post. Please try again.');
            }
        }
    });
}

window.deletePost = deletePost;

// ===== Save Details =====
async function handleSaveDetails(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('save-details-btn');
    const originalText = saveBtn.textContent;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const name = document.getElementById('settings-name').value.trim();
    const description = document.getElementById('settings-description').value.trim();
    const frequency = document.getElementById('settings-frequency').value;

    try {
        const { error } = await supabase
            .from('automations')
            .update({ name, description, frequency })
            .eq('id', currentAutomation.id);

        if (error) throw error;

        // Update page
        document.getElementById('breadcrumb-automation').textContent = name;
        document.getElementById('automation-title').textContent = name;
        document.getElementById('automation-description').textContent = description;

        currentAutomation.name = name;
        currentAutomation.description = description;
        currentAutomation.frequency = frequency;

        // Celebrate!
        celebrateSubtle();
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }, 1500);

    } catch (error) {
        console.error('Error saving details:', error);
        alert('Error saving details. Please try again.');
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// ===== Save Blog Settings =====
async function handleSaveBlogSettings(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('save-blog-settings-btn');
    const originalText = saveBtn.textContent;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    blogSettings.tone = document.getElementById('settings-tone').value;
    blogSettings.length = document.getElementById('settings-length').value;

    try {
        const { error } = await supabase
            .from('automations')
            .update({
                settings: blogSettings
            })
            .eq('id', currentAutomation.id);

        if (error) throw error;

        // Celebrate!
        celebrateSubtle();
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }, 1500);

    } catch (error) {
        console.error('Error saving blog settings:', error);
        alert('Error saving blog settings. Please try again.');
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// ===== Delete Automation =====
function handleDeleteAutomation() {
    DangerModal.show({
        title: 'Delete Automation',
        itemName: currentAutomation.name,
        warningText: 'This will permanently delete the automation and ALL its generated blog posts. This action cannot be undone.',
        confirmPhrase: 'YES DELETE THIS AUTOMATION',
        confirmButtonText: 'Delete Forever',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('automations')
                    .delete()
                    .eq('id', currentAutomation.id);

                if (error) throw error;

                // Small delay then redirect
                setTimeout(() => {
                    window.location.href = `/app/project.html#${currentProject.id}`;
                }, 500);

            } catch (error) {
                console.error('Error deleting automation:', error);
                alert('Error deleting automation. Please try again.');
            }
        }
    });
}

// ===== Utility Functions =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAutomation);
