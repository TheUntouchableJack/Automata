// ===== Supabase Configuration =====
const SUPABASE_URL = 'https://vhpmmfhfwnpmavytoomd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocG1tZmhmd25wbWF2eXRvb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTgyMDYsImV4cCI6MjA4NTE3NDIwNn0.6JmfnTTR8onr3ZgFpzdZa4BbVBraUyePVEUHOJgxmuk';

// Initialize Supabase client
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Make client available globally for other scripts
window.supabase = db;

// ===== Auth Helper Functions =====

/**
 * Get the current authenticated user
 * @returns {Promise<object|null>} User object or null
 */
async function getCurrentUser() {
    if (!db) {
        console.error('Supabase not initialized');
        return null;
    }

    const { data: { user }, error } = await db.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    return user;
}

/**
 * Get the current session
 * @returns {Promise<object|null>} Session object or null
 */
async function getSession() {
    const { data: { session }, error } = await db.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: object|null, error: object|null}>}
 */
async function signIn(email, password) {
    if (!db) {
        return { user: null, error: { message: 'Supabase not initialized. Please refresh the page.' } };
    }

    const { data, error } = await db.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return { user: null, error };
    }

    return { user: data.user, error: null };
}

/**
 * Sign up with email and password
 * @param {string} email
 * @param {string} password
 * @param {string} firstName
 * @param {string} lastName
 * @returns {Promise<{user: object|null, error: object|null}>}
 */
async function signUp(email, password, firstName, lastName) {
    const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName
            }
        }
    });

    if (error) {
        return { user: null, error };
    }

    return { user: data.user, error: null };
}

/**
 * Sign out the current user
 * @returns {Promise<{error: object|null}>}
 */
async function signOut() {
    const { error } = await db.auth.signOut();
    if (!error) {
        window.location.href = '/app/login.html';
    }
    return { error };
}

/**
 * Get user profile from profiles table
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUserProfile(userId) {
    const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}

/**
 * Check if user is admin
 * @returns {Promise<boolean>}
 */
async function isAdmin() {
    const user = await getCurrentUser();
    if (!user) return false;

    const profile = await getUserProfile(user.id);
    return profile?.is_admin || false;
}

/**
 * Require authentication - redirect to login if not authenticated
 * @returns {Promise<object|null>} User object or null (if redirecting)
 */
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/app/login.html';
        return null;
    }
    return user;
}

/**
 * Redirect authenticated users away from login/signup pages
 */
async function redirectIfAuthenticated() {
    const user = await getCurrentUser();
    if (user) {
        window.location.href = '/app/dashboard.html';
    }
}

// ===== Auth State Change Listener =====
if (db) {
    db.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            // Clear any cached data
            localStorage.removeItem('automata_user_profile');
        }
    });
}
