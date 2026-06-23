// Supabase Client Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://dnnckdbxyzkqrbroqopj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubmNrZGJ4eXprcXJicm9xb3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzE3NzUsImV4cCI6MjA5MTI0Nzc3NX0._pu_YpBqTIn42EdkwXbkUu_nnXbynz36HnEgMJj7hK8';

// Simple Supabase client wrapper (no module bundler needed)
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.authChangeCallbacks = [];
    
    // Try to restore session
    this.restoreSession();
  }

  // ========== AUTH ==========
  async signUp(email, password, username) {
    try {
      const response = await fetch(`${this.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.key
        },
        body: JSON.stringify({
          email,
          password,
          data: { username }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || data.msg || 'Signup failed');
      
      if (data.access_token) {
        this.setSession(data);
      }
      
      return { user: data.user || data, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.key
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error_description || data.error || 'Login failed');

      this.setSession(data);
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  async signOut() {
    try {
      if (this.accessToken) {
        await fetch(`${this.url}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'apikey': this.key
          }
        });
      }
    } catch (e) {
      // ignore
    }
    this.clearSession();
  }

  getUser() {
    return this.user;
  }

  onAuthStateChange(callback) {
    this.authChangeCallbacks.push(callback);
    // Immediate callback with current state
    callback(this.user ? 'SIGNED_IN' : 'SIGNED_OUT', this.user);
  }

  setSession(data) {
    this.user = data.user;
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    
    localStorage.setItem('fitdl_session', JSON.stringify({
      user: data.user,
      access_token: data.access_token,
      refresh_token: data.refresh_token
    }));

    this.authChangeCallbacks.forEach(cb => cb('SIGNED_IN', this.user));
  }

  clearSession() {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('fitdl_session');
    this.authChangeCallbacks.forEach(cb => cb('SIGNED_OUT', null));
  }

  restoreSession() {
    try {
      const session = JSON.parse(localStorage.getItem('fitdl_session'));
      if (session && session.access_token) {
        this.user = session.user;
        this.accessToken = session.access_token;
        this.refreshToken = session.refresh_token;
      }
    } catch (e) {
      this.clearSession();
    }
  }

  // ========== DATABASE ==========
  async query(table, method = 'GET', body = null, filters = '') {
    const headers = {
      'apikey': this.key,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : undefined
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Remove undefined headers
    Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k]);

    const response = await fetch(`${this.url}/rest/v1/${table}${filters}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Query failed: ${response.status}`);
    }

    return response.json();
  }

  async insertDownloadHistory(record) {
    if (!this.user) return null;
    try {
      return await this.query('download_history', 'POST', {
        user_id: this.user.id,
        ...record
      });
    } catch (e) {
      console.error('Failed to insert history:', e);
      return null;
    }
  }

  async getDownloadHistory(limit = 50, offset = 0) {
    if (!this.user) return [];
    try {
      return await this.query(
        'download_history',
        'GET',
        null,
        `?user_id=eq.${this.user.id}&order=downloaded_at.desc&limit=${limit}&offset=${offset}`
      );
    } catch (e) {
      console.error('Failed to get history:', e);
      return [];
    }
  }

  async clearDownloadHistory() {
    if (!this.user) return;
    try {
      return await this.query(
        'download_history',
        'DELETE',
        null,
        `?user_id=eq.${this.user.id}`
      );
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  }

  async getDownloadCount() {
    if (!this.user) return 0;
    try {
      const data = await this.query(
        'download_history',
        'GET',
        null,
        `?user_id=eq.${this.user.id}&select=id`
      );
      return data.length;
    } catch (e) {
      return 0;
    }
  }
}

// Global instance
const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
