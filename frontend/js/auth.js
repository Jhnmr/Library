// Gestión de Autenticación

const Auth = {
    currentUser: null,

    async init() {
        const token = localStorage.getItem('token');

        if (token) {
            try {
                const response = await api.getCurrentUser();
                this.currentUser = response.data.user;
                this.showMainApp();
            } catch (error) {
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    },

    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    },

    showMainApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';

        // Actualizar información del usuario
        document.getElementById('currentUserName').textContent = this.currentUser.username;
        document.getElementById('currentUserRole').textContent = this.currentUser.role;

        // Mostrar menú de usuarios solo para admins
        if (this.currentUser.role === 'admin') {
            document.getElementById('usersNav').style.display = 'flex';
        }

        // Cargar vista inicial
        App.loadView('files');
    },

    async login(username, password) {
        try {
            const response = await api.login(username, password);
            api.setToken(response.data.token);
            this.currentUser = response.data.user;
            this.showMainApp();
            UI.showToast('Bienvenido ' + username, 'success');
        } catch (error) {
            throw error;
        }
    },

    async logout() {
        api.clearToken();
        this.currentUser = null;
        this.showLogin();
        UI.showToast('Sesión cerrada', 'success');
    },

    async changePassword(currentPassword, newPassword) {
        try {
            await api.changePassword(currentPassword, newPassword);
            UI.showToast('Contraseña actualizada correctamente', 'success');
        } catch (error) {
            throw error;
        }
    },

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
};

// Event Listeners para Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.remove('show');

    try {
        await Auth.login(username, password);
    } catch (error) {
        errorDiv.textContent = error.message || 'Error al iniciar sesión';
        errorDiv.classList.add('show');
    }
});

// Event Listener para Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        Auth.logout();
    }
});
