// Configuración

const Settings = {
    async loadSettings() {
        try {
            const response = await api.getServerInfo();
            this.renderServerInfo(response.data);
        } catch (error) {
            console.error('Error loading settings:', error);
            UI.showToast('Error al cargar configuración', 'error');
        }
    },

    renderServerInfo(data) {
        const container = document.getElementById('serverInfo');
        container.innerHTML = '';

        const infoItems = [
            { label: 'Versión', value: data.version },
            { label: 'Entorno', value: data.environment },
            { label: 'Acceso Remoto', value: data.remoteAccess ? 'Habilitado' : 'Deshabilitado' },
            { label: 'Tamaño Máximo de Archivo', value: UI.formatFileSize(data.storage.maxFileSize) }
        ];

        // Mostrar direcciones de red
        if (data.networkInterfaces && data.networkInterfaces.length > 0) {
            data.networkInterfaces.forEach(iface => {
                infoItems.push({
                    label: `IP Local (${iface.name})`,
                    value: iface.address
                });
            });
        }

        infoItems.forEach(item => {
            const infoItem = document.createElement('div');
            infoItem.style.padding = '15px';
            infoItem.style.background = 'var(--bg-tertiary)';
            infoItem.style.borderRadius = '8px';
            infoItem.style.marginBottom = '12px';

            infoItem.innerHTML = `
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${item.label}</div>
                <div style="font-weight: 600;">${item.value}</div>
            `;

            container.appendChild(infoItem);
        });
    }
};

// Event Listener para cambio de contraseña
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        UI.showToast('Las contraseñas no coinciden', 'error');
        return;
    }

    if (newPassword.length < 6) {
        UI.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    try {
        await Auth.changePassword(currentPassword, newPassword);
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        UI.showToast(error.message, 'error');
    }
});
