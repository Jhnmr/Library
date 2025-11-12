// Gestión de Usuarios (Solo Admin)

const Users = {
    async loadUsers() {
        if (!Auth.isAdmin()) {
            UI.showToast('Acceso denegado', 'error');
            return;
        }

        try {
            const response = await api.getUsers();
            this.renderUsers(response.data.users);
        } catch (error) {
            console.error('Error loading users:', error);
            UI.showToast('Error al cargar usuarios', 'error');
        }
    },

    renderUsers(users) {
        const container = document.getElementById('usersContainer');
        container.innerHTML = '';

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        table.innerHTML = `
            <thead>
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <th style="padding: 15px; text-align: left;">Usuario</th>
                    <th style="padding: 15px; text-align: left;">Rol</th>
                    <th style="padding: 15px; text-align: left;">Creado</th>
                    <th style="padding: 15px; text-align: left;">Último acceso</th>
                    <th style="padding: 15px; text-align: right;">Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        users.forEach(user => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--border-color)';

            const isCurrentUser = user.id === Auth.currentUser.id;

            row.innerHTML = `
                <td style="padding: 15px;">
                    <i class="fas fa-user-circle" style="color: var(--accent-cyan); margin-right: 10px;"></i>
                    ${user.username}
                    ${isCurrentUser ? '<span style="color: var(--accent-green); font-size: 12px; margin-left: 8px;">(tú)</span>' : ''}
                </td>
                <td style="padding: 15px;">
                    <span style="
                        padding: 4px 12px;
                        background: ${user.role === 'admin' ? 'var(--accent-blue)' : 'var(--bg-tertiary)'};
                        color: ${user.role === 'admin' ? 'white' : 'var(--text-primary)'};
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                    ">${user.role}</span>
                </td>
                <td style="padding: 15px; color: var(--text-secondary);">${UI.formatDate(user.created_at)}</td>
                <td style="padding: 15px; color: var(--text-secondary);">${user.last_login ? UI.formatDate(user.last_login) : 'Nunca'}</td>
                <td style="padding: 15px; text-align: right;">
                    ${!isCurrentUser ? `
                        <button class="btn btn-danger" style="padding: 6px 12px;" onclick="Users.deleteUser(${user.id}, '${user.username}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '<span style="color: var(--text-secondary); font-size: 12px;">-</span>'}
                </td>
            `;

            tbody.appendChild(row);
        });

        container.appendChild(table);
    },

    showCreateUserDialog() {
        const bodyContent = `
            <form id="createUserForm">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Nombre de usuario</label>
                    <input type="text" id="newUsername" required style="width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Contraseña</label>
                    <input type="password" id="newUserPassword" required style="width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label>Rol</label>
                    <select id="newUserRole" style="width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
            </form>
        `;

        UI.showModal('Nuevo Usuario', bodyContent, [
            {
                text: '<i class="fas fa-user-plus"></i> Crear',
                className: 'btn btn-primary',
                onClick: async () => {
                    const username = document.getElementById('newUsername').value;
                    const password = document.getElementById('newUserPassword').value;
                    const role = document.getElementById('newUserRole').value;

                    if (!username || !password) {
                        UI.showToast('Completa todos los campos', 'error');
                        return;
                    }

                    try {
                        await api.createUser(username, password, role);
                        UI.showToast('Usuario creado exitosamente', 'success');
                        UI.hideModal('genericModal');
                        this.loadUsers();
                    } catch (error) {
                        UI.showToast(error.message, 'error');
                    }
                }
            }
        ]);
    },

    async deleteUser(userId, username) {
        if (!confirm(`¿Eliminar usuario "${username}"?`)) {
            return;
        }

        try {
            await api.deleteUser(userId);
            UI.showToast('Usuario eliminado', 'success');
            this.loadUsers();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
};

// Event Listeners
document.getElementById('createUserBtn').addEventListener('click', () => {
    Users.showCreateUserDialog();
});
