// API Client para la Biblioteca Virtual

const API_BASE_URL = '/api';

class API {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    // Files
    async uploadFile(file, folderId = null) {
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) {
            formData.append('folderId', folderId);
        }

        const url = `${API_BASE_URL}/files/upload`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al subir archivo');
        }

        return data;
    }

    async getFiles(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/files?${queryString}`);
    }

    async getFileInfo(id) {
        return this.request(`/files/${id}`);
    }

    async deleteFile(id) {
        return this.request(`/files/${id}`, { method: 'DELETE' });
    }

    async moveFile(id, folderId) {
        return this.request(`/files/${id}/move`, {
            method: 'PUT',
            body: JSON.stringify({ folderId })
        });
    }

    getFileDownloadUrl(id) {
        return `${API_BASE_URL}/files/${id}/download`;
    }

    getFileServeUrl(id) {
        return `${API_BASE_URL}/files/${id}/serve`;
    }

    // Folders
    async getFolders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/folders?${queryString}`);
    }

    async createFolder(name, parentId = null) {
        return this.request('/folders', {
            method: 'POST',
            body: JSON.stringify({ name, parentId })
        });
    }

    async getFolderInfo(id) {
        return this.request(`/folders/${id}`);
    }

    async getFolderPath(id) {
        return this.request(`/folders/${id}/path`);
    }

    async updateFolder(id, name, parentId) {
        return this.request(`/folders/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, parentId })
        });
    }

    async deleteFolder(id, force = false) {
        return this.request(`/folders/${id}?force=${force}`, { method: 'DELETE' });
    }

    // Stats
    async getSystemStats() {
        return this.request('/stats/system');
    }

    async getUserStats() {
        return this.request('/stats/user');
    }

    async getAccessLogs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/stats/logs?${queryString}`);
    }

    // Duplicates
    async findDuplicates() {
        return this.request('/duplicates');
    }

    async resolveDuplicates(keepFileId, deleteFileIds) {
        return this.request('/duplicates/resolve', {
            method: 'POST',
            body: JSON.stringify({ keepFileId, deleteFileIds })
        });
    }

    async checkIntegrity() {
        return this.request('/duplicates/integrity');
    }

    async cleanOrphans(deleteFiles = false) {
        return this.request(`/duplicates/orphans?delete=${deleteFiles}`);
    }

    // Users (Admin only)
    async getUsers() {
        return this.request('/users');
    }

    async createUser(username, password, role) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify({ username, password, role })
        });
    }

    async updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, { method: 'DELETE' });
    }

    // Server
    async getServerInfo() {
        return this.request('/server-info');
    }

    async getHealth() {
        return this.request('/health');
    }
}

const api = new API();
