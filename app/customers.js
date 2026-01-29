// ===== Customers Page Initialization =====
let currentUser = null;
let currentOrganization = null;
let customers = [];
let customFields = [];
let currentPage = 1;
const PAGE_SIZE = 50;
let totalCustomers = 0;
let editingCustomerId = null;
let customerTags = [];
let csvData = null;
let columnMapping = {};
let deleteCustomerId = null;

async function initCustomers() {
    // Require authentication
    currentUser = await requireAuth();
    if (!currentUser) return;

    // Load user info
    await loadUserInfo();

    // Load organization
    await loadOrganization();

    // Load custom fields
    await loadCustomFields();

    // Load customers
    await loadCustomers();

    // Setup event listeners
    setupEventListeners();
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

// ===== Load Custom Fields =====
async function loadCustomFields() {
    if (!currentOrganization) return;

    try {
        const { data, error } = await supabase
            .from('custom_fields')
            .select('*')
            .eq('organization_id', currentOrganization.id)
            .order('display_order');

        if (error) throw error;
        customFields = data || [];
    } catch (error) {
        console.error('Error loading custom fields:', error);
    }
}

// ===== Load Customers =====
async function loadCustomers() {
    const loading = document.getElementById('loading');
    const container = document.getElementById('customers-container');
    const emptyState = document.getElementById('empty-state');
    const pagination = document.getElementById('pagination');

    if (!currentOrganization) {
        loading.innerHTML = '<p style="color: var(--color-error);">No organization found.</p>';
        return;
    }

    try {
        // Get filters
        const search = document.getElementById('search-input').value.trim().toLowerCase();
        const tagFilter = document.getElementById('tag-filter').value;
        const sourceFilter = document.getElementById('source-filter').value;

        // Build query
        let query = supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .eq('organization_id', currentOrganization.id)
            .order('created_at', { ascending: false })
            .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

        if (sourceFilter) {
            query = query.eq('source', sourceFilter);
        }

        if (tagFilter) {
            query = query.contains('tags', [tagFilter]);
        }

        if (search) {
            query = query.ilike('searchable_name', `%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        loading.style.display = 'none';
        customers = data || [];
        totalCustomers = count || 0;

        // Update stats
        updateStats();

        if (customers.length === 0 && currentPage === 1 && !search && !tagFilter && !sourceFilter) {
            emptyState.style.display = 'block';
            container.style.display = 'none';
            pagination.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            container.style.display = 'block';
            renderCustomers();
            updatePagination();
        }

        // Load unique tags for filter
        loadTags();

    } catch (error) {
        console.error('Error loading customers:', error);
        loading.innerHTML = '<p style="color: var(--color-error);">Error loading customers. Please refresh.</p>';
    }
}

async function updateStats() {
    document.getElementById('total-customers').textContent = totalCustomers.toLocaleString();

    // Get new this month count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    try {
        const { count: newCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', currentOrganization.id)
            .gte('created_at', startOfMonth.toISOString());

        document.getElementById('new-this-month').textContent = (newCount || 0).toLocaleString();

        // Get with email count
        const { count: emailCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', currentOrganization.id)
            .not('email', 'is', null)
            .neq('email', '');

        document.getElementById('with-email').textContent = (emailCount || 0).toLocaleString();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadTags() {
    try {
        const { data } = await supabase
            .from('customers')
            .select('tags')
            .eq('organization_id', currentOrganization.id);

        const allTags = new Set();
        data?.forEach(c => {
            c.tags?.forEach(tag => allTags.add(tag));
        });

        const tagFilter = document.getElementById('tag-filter');
        const currentValue = tagFilter.value;
        tagFilter.innerHTML = '<option value="">All Tags</option>';

        Array.from(allTags).sort().forEach(tag => {
            tagFilter.innerHTML += `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`;
        });

        tagFilter.value = currentValue;
    } catch (error) {
        console.error('Error loading tags:', error);
    }
}

function renderCustomers() {
    const tbody = document.getElementById('customers-table-body');

    tbody.innerHTML = customers.map(customer => {
        const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unknown';
        const initials = getInitials(customer.first_name, customer.last_name);
        const tags = customer.tags || [];
        const displayTags = tags.slice(0, 2);
        const moreTags = tags.length > 2 ? tags.length - 2 : 0;
        const createdDate = new Date(customer.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `
            <tr data-id="${customer.id}">
                <td>
                    <input type="checkbox" class="customer-checkbox" data-id="${customer.id}">
                </td>
                <td>
                    <div class="customer-name">
                        <span class="customer-avatar">${initials}</span>
                        <span class="customer-name-text">${escapeHtml(name)}</span>
                    </div>
                </td>
                <td>
                    <span class="customer-email">${escapeHtml(customer.email || '-')}</span>
                </td>
                <td>
                    <span class="customer-company">${escapeHtml(customer.company || '-')}</span>
                </td>
                <td>
                    <div class="customer-tags">
                        ${displayTags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        ${moreTags > 0 ? `<span class="tag tag-more">+${moreTags}</span>` : ''}
                    </div>
                </td>
                <td>
                    <span class="customer-source ${customer.source || ''}">${formatSource(customer.source)}</span>
                </td>
                <td>
                    <span class="customer-date">${createdDate}</span>
                </td>
                <td>
                    <div class="customer-actions">
                        <button class="btn-icon" onclick="editCustomer('${customer.id}')" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon danger" onclick="confirmDeleteCustomer('${customer.id}')" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 4H13M6 4V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V4M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4H12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function formatSource(source) {
    const sources = {
        'csv_import': 'CSV Import',
        'manual': 'Manual',
        'api': 'API'
    };
    return sources[source] || source || 'Unknown';
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(totalCustomers / PAGE_SIZE);

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';
    document.getElementById('pagination-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

// ===== Event Listeners =====
function setupEventListeners() {
    // User menu
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

    // Search and filters
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadCustomers();
        }, 300);
    });

    document.getElementById('tag-filter').addEventListener('change', () => {
        currentPage = 1;
        loadCustomers();
    });

    document.getElementById('source-filter').addEventListener('change', () => {
        currentPage = 1;
        loadCustomers();
    });

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadCustomers();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(totalCustomers / PAGE_SIZE);
        if (currentPage < totalPages) {
            currentPage++;
            loadCustomers();
        }
    });

    // Select all checkbox
    document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
        document.querySelectorAll('.customer-checkbox').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Add customer buttons
    document.getElementById('add-customer-btn').addEventListener('click', () => openCustomerModal());
    document.getElementById('empty-add-btn')?.addEventListener('click', () => openCustomerModal());

    // Customer modal
    document.getElementById('customer-modal-close').addEventListener('click', closeCustomerModal);
    document.getElementById('customer-modal-cancel').addEventListener('click', closeCustomerModal);
    document.getElementById('customer-modal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeCustomerModal();
    });
    document.getElementById('customer-form').addEventListener('submit', handleSaveCustomer);

    // Tags input
    document.getElementById('customer-tags-input').addEventListener('keydown', handleTagInput);

    // CSV Import buttons
    document.getElementById('import-csv-btn').addEventListener('click', openCsvModal);
    document.getElementById('empty-import-btn')?.addEventListener('click', openCsvModal);

    // CSV modal controls
    document.getElementById('csv-modal-close').addEventListener('click', closeCsvModal);
    document.getElementById('csv-cancel-upload').addEventListener('click', closeCsvModal);

    // CSV upload
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('csv-file-input');

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            handleFileSelect(file);
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileSelect(file);
    });

    document.getElementById('remove-file').addEventListener('click', resetFileUpload);

    // CSV navigation
    document.getElementById('csv-next-mapping').addEventListener('click', showMappingStep);
    document.getElementById('csv-back-upload').addEventListener('click', showUploadStep);
    document.getElementById('csv-next-review').addEventListener('click', showReviewStep);
    document.getElementById('csv-back-mapping').addEventListener('click', showMappingStep);
    document.getElementById('csv-import-btn').addEventListener('click', handleCsvImport);
    document.getElementById('csv-done').addEventListener('click', () => {
        closeCsvModal();
        loadCustomers();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCustomerModal();
            closeCsvModal();
        }
    });
}

// ===== Customer Modal =====
function openCustomerModal(customer = null) {
    editingCustomerId = customer?.id || null;
    customerTags = customer?.tags || [];

    document.getElementById('customer-modal-title').textContent = customer ? 'Edit Customer' : 'Add Customer';
    document.getElementById('customer-submit-btn').textContent = customer ? 'Save Changes' : 'Add Customer';

    // Reset form
    document.getElementById('customer-form').reset();
    document.getElementById('customer-tags-list').innerHTML = '';

    if (customer) {
        document.getElementById('customer-first-name').value = customer.first_name || '';
        document.getElementById('customer-last-name').value = customer.last_name || '';
        document.getElementById('customer-email').value = customer.email || '';
        document.getElementById('customer-phone').value = customer.phone || '';
        document.getElementById('customer-company').value = customer.company || '';

        // Render tags
        customerTags.forEach(tag => addTagToList(tag));
    }

    // Render custom fields
    renderCustomFieldsForm(customer?.custom_data || {});

    document.getElementById('customer-modal').classList.add('active');
    document.getElementById('customer-first-name').focus();
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.remove('active');
    editingCustomerId = null;
    customerTags = [];
}

function renderCustomFieldsForm(customData) {
    const section = document.getElementById('custom-fields-section');

    if (customFields.length === 0) {
        section.innerHTML = '';
        return;
    }

    section.innerHTML = `
        <div class="form-divider">
            <span>Custom Fields</span>
        </div>
        ${customFields.map(field => {
            const value = customData[field.field_key] || '';
            let input;

            switch (field.field_type) {
                case 'select':
                    const options = field.options || [];
                    input = `
                        <select id="custom-${field.field_key}" name="custom_${field.field_key}">
                            <option value="">Select...</option>
                            ${options.map(opt => `<option value="${escapeHtml(opt)}" ${value === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
                        </select>
                    `;
                    break;
                case 'boolean':
                    input = `
                        <label class="checkbox-label">
                            <input type="checkbox" id="custom-${field.field_key}" name="custom_${field.field_key}" ${value ? 'checked' : ''}>
                            <span>Yes</span>
                        </label>
                    `;
                    break;
                case 'number':
                    input = `<input type="number" id="custom-${field.field_key}" name="custom_${field.field_key}" value="${escapeHtml(value)}">`;
                    break;
                case 'date':
                    input = `<input type="date" id="custom-${field.field_key}" name="custom_${field.field_key}" value="${escapeHtml(value)}">`;
                    break;
                default:
                    input = `<input type="text" id="custom-${field.field_key}" name="custom_${field.field_key}" value="${escapeHtml(value)}">`;
            }

            return `
                <div class="form-group">
                    <label for="custom-${field.field_key}">${escapeHtml(field.name)}${field.is_required ? ' *' : ''}</label>
                    ${input}
                </div>
            `;
        }).join('')}
    `;
}

function handleTagInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const input = e.target;
        const tag = input.value.trim();

        if (tag && !customerTags.includes(tag)) {
            customerTags.push(tag);
            addTagToList(tag);
        }

        input.value = '';
    }
}

function addTagToList(tag) {
    const tagsList = document.getElementById('customer-tags-list');
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.innerHTML = `
        ${escapeHtml(tag)}
        <button type="button" class="tag-remove" onclick="removeTag('${escapeHtml(tag)}')">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        </button>
    `;
    tagsList.appendChild(tagEl);
}

function removeTag(tag) {
    customerTags = customerTags.filter(t => t !== tag);
    const tagsList = document.getElementById('customer-tags-list');
    tagsList.innerHTML = '';
    customerTags.forEach(t => addTagToList(t));
}

window.removeTag = removeTag;

async function handleSaveCustomer(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('customer-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const customerData = {
        organization_id: currentOrganization.id,
        first_name: document.getElementById('customer-first-name').value.trim() || null,
        last_name: document.getElementById('customer-last-name').value.trim() || null,
        email: document.getElementById('customer-email').value.trim() || null,
        phone: document.getElementById('customer-phone').value.trim() || null,
        company: document.getElementById('customer-company').value.trim() || null,
        tags: customerTags,
        source: editingCustomerId ? undefined : 'manual'
    };

    // Gather custom field values
    const customData = {};
    customFields.forEach(field => {
        const input = document.getElementById(`custom-${field.field_key}`);
        if (input) {
            if (field.field_type === 'boolean') {
                customData[field.field_key] = input.checked;
            } else {
                customData[field.field_key] = input.value || null;
            }
        }
    });
    customerData.custom_data = customData;

    try {
        if (editingCustomerId) {
            delete customerData.organization_id;
            delete customerData.source;
            const { error } = await supabase
                .from('customers')
                .update(customerData)
                .eq('id', editingCustomerId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('customers')
                .insert([customerData]);
            if (error) throw error;
        }

        celebrateSubtle();
        closeCustomerModal();
        loadCustomers();

    } catch (error) {
        console.error('Error saving customer:', error);
        alert('Error saving customer. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (customer) {
        openCustomerModal(customer);
    }
}

window.editCustomer = editCustomer;

// ===== Delete Customer =====
function confirmDeleteCustomer(id) {
    // Find the customer to get their name
    const customer = customers.find(c => c.id === id);
    const customerName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email : 'this customer';

    DangerModal.show({
        title: 'Delete Customer',
        itemName: customerName,
        warningText: 'This action will permanently delete this customer and all their associated data. This cannot be undone.',
        confirmPhrase: 'YES DELETE THIS CUSTOMER',
        confirmButtonText: 'Delete Forever',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('customers')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                loadCustomers();
            } catch (error) {
                console.error('Error deleting customer:', error);
                alert('Error deleting customer. Please try again.');
            }
        }
    });
}

window.confirmDeleteCustomer = confirmDeleteCustomer;

// ===== CSV Import =====
function openCsvModal() {
    resetCsvModal();
    document.getElementById('csv-import-modal').classList.add('active');
}

function closeCsvModal() {
    document.getElementById('csv-import-modal').classList.remove('active');
    resetCsvModal();
}

function resetCsvModal() {
    csvData = null;
    columnMapping = {};
    resetFileUpload();
    showUploadStep();
}

function resetFileUpload() {
    document.getElementById('csv-file-input').value = '';
    document.getElementById('upload-zone').style.display = 'block';
    document.getElementById('file-preview').style.display = 'none';
    document.getElementById('csv-next-mapping').disabled = true;
}

function handleFileSelect(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            csvData = results;

            document.getElementById('upload-zone').style.display = 'none';
            document.getElementById('file-preview').style.display = 'flex';
            document.getElementById('file-name').textContent = file.name;
            document.getElementById('file-meta').textContent = `${results.data.length} rows detected`;
            document.getElementById('csv-next-mapping').disabled = false;

            // Auto-detect column mappings
            autoDetectMappings(results.meta.fields);
        },
        error: (error) => {
            console.error('CSV parse error:', error);
            alert('Error parsing CSV file. Please check the file format.');
        }
    });
}

function autoDetectMappings(headers) {
    columnMapping = {};

    const mappings = {
        'email': ['email', 'e-mail', 'email address', 'emailaddress'],
        'first_name': ['first name', 'firstname', 'first', 'fname', 'given name'],
        'last_name': ['last name', 'lastname', 'last', 'lname', 'surname', 'family name'],
        'phone': ['phone', 'telephone', 'phone number', 'phonenumber', 'mobile', 'cell'],
        'company': ['company', 'organization', 'organisation', 'company name', 'business']
    };

    headers.forEach(header => {
        const normalized = header.toLowerCase().trim();
        for (const [field, patterns] of Object.entries(mappings)) {
            if (patterns.includes(normalized)) {
                columnMapping[header] = field;
                break;
            }
        }
    });
}

function showUploadStep() {
    document.getElementById('import-step-upload').style.display = 'block';
    document.getElementById('import-step-mapping').style.display = 'none';
    document.getElementById('import-step-review').style.display = 'none';
    document.getElementById('import-step-complete').style.display = 'none';
}

function showMappingStep() {
    document.getElementById('import-step-upload').style.display = 'none';
    document.getElementById('import-step-mapping').style.display = 'block';
    document.getElementById('import-step-review').style.display = 'none';
    document.getElementById('import-step-complete').style.display = 'none';

    renderMappingUI();
}

function renderMappingUI() {
    const list = document.getElementById('mapping-list');
    const headers = csvData.meta.fields;
    const sampleRow = csvData.data[0] || {};

    const fieldOptions = [
        { value: '', label: 'Skip this column' },
        { value: 'email', label: 'Email' },
        { value: 'first_name', label: 'First Name' },
        { value: 'last_name', label: 'Last Name' },
        { value: 'phone', label: 'Phone' },
        { value: 'company', label: 'Company' },
        ...customFields.map(f => ({ value: `custom:${f.field_key}`, label: f.name }))
    ];

    list.innerHTML = headers.map(header => {
        const currentMapping = columnMapping[header] || '';
        const sample = sampleRow[header] || '';
        const isAutoDetected = currentMapping !== '';

        return `
            <div class="mapping-row">
                <div class="mapping-source">
                    <div>${escapeHtml(header)}</div>
                    <div class="mapping-source-sample">${escapeHtml(sample)}</div>
                </div>
                <div class="mapping-arrow">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 10H16M16 10L12 6M16 10L12 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="mapping-target">
                    <select data-header="${escapeHtml(header)}" class="${isAutoDetected ? 'auto-detected' : ''}" onchange="updateMapping(this)">
                        ${fieldOptions.map(opt => `
                            <option value="${opt.value}" ${currentMapping === opt.value ? 'selected' : ''}>${opt.label}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `;
    }).join('');
}

function updateMapping(select) {
    const header = select.dataset.header;
    const value = select.value;

    if (value) {
        columnMapping[header] = value;
    } else {
        delete columnMapping[header];
    }

    select.classList.remove('auto-detected');
}

window.updateMapping = updateMapping;

async function showReviewStep() {
    document.getElementById('import-step-upload').style.display = 'none';
    document.getElementById('import-step-mapping').style.display = 'none';
    document.getElementById('import-step-review').style.display = 'block';
    document.getElementById('import-step-complete').style.display = 'none';

    const totalRows = csvData.data.length;
    document.getElementById('review-total').textContent = totalRows;

    // Check for existing emails
    const emailColumn = Object.entries(columnMapping).find(([_, v]) => v === 'email');
    let existingCount = 0;

    if (emailColumn) {
        const emails = csvData.data
            .map(row => row[emailColumn[0]])
            .filter(e => e && e.trim());

        if (emails.length > 0) {
            try {
                const { data } = await supabase
                    .from('customers')
                    .select('email')
                    .eq('organization_id', currentOrganization.id)
                    .in('email', emails);

                existingCount = data?.length || 0;
            } catch (error) {
                console.error('Error checking existing emails:', error);
            }
        }
    }

    document.getElementById('review-new').textContent = totalRows - existingCount;
    document.getElementById('review-update').textContent = existingCount;

    // Render preview table
    renderPreviewTable();
}

function renderPreviewTable() {
    const thead = document.getElementById('preview-thead');
    const tbody = document.getElementById('preview-tbody');

    const mappedHeaders = Object.entries(columnMapping)
        .filter(([_, v]) => v)
        .map(([header, field]) => ({ header, field }));

    thead.innerHTML = `
        <tr>
            ${mappedHeaders.map(({ field }) => {
                const label = field.startsWith('custom:')
                    ? customFields.find(f => f.field_key === field.replace('custom:', ''))?.name || field
                    : field.replace('_', ' ');
                return `<th>${escapeHtml(label)}</th>`;
            }).join('')}
        </tr>
    `;

    const previewRows = csvData.data.slice(0, 5);
    tbody.innerHTML = previewRows.map(row => `
        <tr>
            ${mappedHeaders.map(({ header }) => `
                <td>${escapeHtml(row[header] || '-')}</td>
            `).join('')}
        </tr>
    `).join('');
}

async function handleCsvImport() {
    const importBtn = document.getElementById('csv-import-btn');
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';

    const updateExisting = document.getElementById('update-existing').checked;

    try {
        const emailColumn = Object.entries(columnMapping).find(([_, v]) => v === 'email');
        let existingEmails = new Map();

        if (updateExisting && emailColumn) {
            const emails = csvData.data
                .map(row => row[emailColumn[0]])
                .filter(e => e && e.trim());

            if (emails.length > 0) {
                const { data } = await supabase
                    .from('customers')
                    .select('id, email')
                    .eq('organization_id', currentOrganization.id)
                    .in('email', emails);

                data?.forEach(c => existingEmails.set(c.email.toLowerCase(), c.id));
            }
        }

        const toInsert = [];
        const toUpdate = [];

        csvData.data.forEach(row => {
            const customer = {
                organization_id: currentOrganization.id,
                source: 'csv_import',
                custom_data: {}
            };

            Object.entries(columnMapping).forEach(([header, field]) => {
                const value = row[header]?.trim() || null;
                if (field.startsWith('custom:')) {
                    customer.custom_data[field.replace('custom:', '')] = value;
                } else {
                    customer[field] = value;
                }
            });

            if (customer.email && existingEmails.has(customer.email.toLowerCase())) {
                toUpdate.push({
                    ...customer,
                    id: existingEmails.get(customer.email.toLowerCase())
                });
            } else {
                toInsert.push(customer);
            }
        });

        // Insert new customers
        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('customers')
                .insert(toInsert);
            if (error) throw error;
        }

        // Update existing customers
        for (const customer of toUpdate) {
            const { id, organization_id, source, ...updateData } = customer;
            const { error } = await supabase
                .from('customers')
                .update(updateData)
                .eq('id', id);
            if (error) throw error;
        }

        // Record import
        await supabase.from('csv_imports').insert([{
            organization_id: currentOrganization.id,
            filename: document.getElementById('file-name').textContent,
            row_count: csvData.data.length,
            column_mapping: columnMapping,
            imported_by: currentUser.id
        }]);

        // Show complete step
        document.getElementById('import-step-review').style.display = 'none';
        document.getElementById('import-step-complete').style.display = 'block';
        document.getElementById('import-result-message').textContent =
            `Successfully imported ${toInsert.length} new customer${toInsert.length !== 1 ? 's' : ''}` +
            (toUpdate.length > 0 ? ` and updated ${toUpdate.length} existing.` : '.');

        celebrate();

    } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error importing customers. Please try again.');
        importBtn.disabled = false;
        importBtn.textContent = 'Import Customers';
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
document.addEventListener('DOMContentLoaded', initCustomers);
