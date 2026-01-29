// ===== Supabase Configuration =====
const SUPABASE_URL = 'https://vhpmmfhfwnpmavytoomd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocG1tZmhmd25wbWF2eXRvb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTgyMDYsImV4cCI6MjA4NTE3NDIwNn0.6JmfnTTR8onr3ZgFpzdZa4BbVBraUyePVEUHOJgxmuk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Page Detection =====
const isPostPage = window.location.pathname.includes('post.html');

if (isPostPage) {
    initPostPage();
} else {
    initBlogIndex();
}

// ===== Blog Index Page =====
async function initBlogIndex() {
    await loadPosts();
    setupFilterListeners();
}

async function loadPosts(industry = 'all') {
    const loading = document.getElementById('loading');
    const postsGrid = document.getElementById('posts-grid');
    const emptyState = document.getElementById('empty-state');

    loading.style.display = 'flex';
    postsGrid.style.display = 'none';
    emptyState.style.display = 'none';

    try {
        let query = supabase
            .from('blog_posts')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });

        if (industry !== 'all') {
            query = query.eq('industry', industry);
        }

        const { data: posts, error } = await query;

        if (error) throw error;

        loading.style.display = 'none';

        if (!posts || posts.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        postsGrid.style.display = 'grid';
        renderPosts(posts);

    } catch (error) {
        console.error('Error loading posts:', error);
        loading.innerHTML = '<p style="color: var(--color-error);">Error loading posts. Please refresh.</p>';
    }
}

function renderPosts(posts) {
    const postsGrid = document.getElementById('posts-grid');

    postsGrid.innerHTML = posts.map(post => {
        const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // Extract excerpt from content (first paragraph)
        const excerpt = extractExcerpt(post.content);

        // Keywords
        const keywords = (post.seo_keywords || []).slice(0, 3);
        const keywordsHtml = keywords.length > 0 ? `
            <div class="post-card-keywords">
                ${keywords.map(kw => `<span class="post-card-keyword">${escapeHtml(kw)}</span>`).join('')}
            </div>
        ` : '';

        return `
            <a href="/blog/post.html#${post.slug}" class="post-card">
                <div class="post-card-image">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M16 16H32M16 24H32M16 32H24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="post-card-content">
                    <div class="post-card-meta">
                        ${post.industry ? `<span class="post-card-industry">${post.industry}</span>` : ''}
                        <span class="post-card-date">${publishedDate}</span>
                    </div>
                    <h2 class="post-card-title">${escapeHtml(post.title)}</h2>
                    <p class="post-card-excerpt">${escapeHtml(excerpt)}</p>
                    ${keywordsHtml}
                </div>
            </a>
        `;
    }).join('');
}

function extractExcerpt(content) {
    if (!content) return '';

    // Remove markdown headers
    let text = content.replace(/^#+\s+.+$/gm, '');

    // Remove markdown formatting
    text = text.replace(/\*\*(.+?)\*\*/g, '$1');
    text = text.replace(/\*(.+?)\*/g, '$1');
    text = text.replace(/\[(.+?)\]\(.+?\)/g, '$1');
    text = text.replace(/`(.+?)`/g, '$1');

    // Get first meaningful paragraph
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
    const firstParagraph = paragraphs[0] || text;

    // Truncate
    return firstParagraph.trim().substring(0, 200) + (firstParagraph.length > 200 ? '...' : '');
}

function setupFilterListeners() {
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active state
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Load posts for industry
            loadPosts(tab.dataset.industry);
        });
    });
}

// ===== Single Post Page =====
async function initPostPage() {
    // Get slug from hash (fallback to query param for compatibility)
    let slug = window.location.hash.slice(1);
    if (!slug) {
        const urlParams = new URLSearchParams(window.location.search);
        slug = urlParams.get('slug');
    }

    if (!slug) {
        showNotFound();
        return;
    }

    await loadPost(slug);
}

async function loadPost(slug) {
    const loading = document.getElementById('loading');
    const postContent = document.getElementById('post-content');
    const notFound = document.getElementById('not-found');

    try {
        const { data: post, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error || !post) {
            showNotFound();
            return;
        }

        loading.style.display = 'none';
        postContent.style.display = 'block';

        // Update page metadata
        document.title = `${post.title} - Automata Blog`;
        document.querySelector('meta[name="description"]').content = extractExcerpt(post.content);

        // Render post
        renderPost(post);

        // Load related posts
        if (post.related_posts && post.related_posts.length > 0) {
            await loadRelatedPosts(post.related_posts);
        } else if (post.industry) {
            await loadRelatedByIndustry(post.industry, post.id);
        }

    } catch (error) {
        console.error('Error loading post:', error);
        showNotFound();
    }
}

function renderPost(post) {
    const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-date').textContent = publishedDate;

    if (post.industry) {
        document.getElementById('post-industry').textContent = post.industry;
        document.getElementById('post-industry').style.display = 'inline-flex';
    } else {
        document.getElementById('post-industry').style.display = 'none';
    }

    // Render markdown content
    const contentHtml = typeof marked !== 'undefined'
        ? marked.parse(post.content || '')
        : post.content.replace(/\n/g, '<br>');

    document.getElementById('post-body').innerHTML = contentHtml;

    // Render keywords
    const keywords = post.seo_keywords || [];
    if (keywords.length > 0) {
        document.getElementById('post-keywords').innerHTML = keywords
            .map(kw => `<span class="post-card-keyword">${escapeHtml(kw)}</span>`)
            .join('');
    }
}

async function loadRelatedPosts(relatedIds) {
    if (!relatedIds || relatedIds.length === 0) return;

    try {
        const { data: posts, error } = await supabase
            .from('blog_posts')
            .select('*')
            .in('id', relatedIds)
            .eq('status', 'published')
            .limit(3);

        if (error || !posts || posts.length === 0) return;

        renderRelatedPosts(posts);

    } catch (error) {
        console.error('Error loading related posts:', error);
    }
}

async function loadRelatedByIndustry(industry, excludeId) {
    try {
        const { data: posts, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('industry', industry)
            .eq('status', 'published')
            .neq('id', excludeId)
            .order('published_at', { ascending: false })
            .limit(3);

        if (error || !posts || posts.length === 0) return;

        renderRelatedPosts(posts);

    } catch (error) {
        console.error('Error loading related posts:', error);
    }
}

function renderRelatedPosts(posts) {
    const relatedSection = document.getElementById('related-posts');
    const relatedGrid = document.getElementById('related-posts-grid');

    relatedSection.style.display = 'block';

    relatedGrid.innerHTML = posts.map(post => {
        const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        return `
            <a href="/blog/post.html#${post.slug}" class="post-card">
                <div class="post-card-content" style="padding: 20px;">
                    <div class="post-card-meta">
                        ${post.industry ? `<span class="post-card-industry">${post.industry}</span>` : ''}
                        <span class="post-card-date">${publishedDate}</span>
                    </div>
                    <h3 class="post-card-title" style="font-size: 1rem;">${escapeHtml(post.title)}</h3>
                </div>
            </a>
        `;
    }).join('');
}

function showNotFound() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('not-found').style.display = 'block';
}

// ===== Utility Functions =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
