// Gestión de Estadísticas

const Stats = {
    async loadStats() {
        try {
            const response = await api.getSystemStats();
            const data = response.data;

            this.renderStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
            UI.showToast('Error al cargar estadísticas', 'error');
        }
    },

    renderStats(data) {
        // Estadísticas generales
        document.getElementById('statTotalFiles').textContent = data.summary.total_files;
        document.getElementById('statTotalFolders').textContent = data.summary.total_folders;
        document.getElementById('statTotalSize').textContent = UI.formatFileSize(data.summary.total_size);
        document.getElementById('statTotalUsers').textContent = data.summary.total_users;

        // Gráfico de archivos por tipo
        this.renderFilesByTypeChart(data.filesByType);

        // Archivos recientes
        this.renderRecentFiles(data.recentFiles);
    },

    renderFilesByTypeChart(filesByType) {
        const container = document.getElementById('filesByTypeChart');
        container.innerHTML = '';

        if (filesByType.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No hay datos</p>';
            return;
        }

        const total = filesByType.reduce((sum, item) => sum + item.count, 0);

        filesByType.forEach(item => {
            const percentage = (item.count / total) * 100;

            const bar = document.createElement('div');
            bar.className = 'chart-bar';

            bar.innerHTML = `
                <div class="chart-label">${item.category}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-value">${item.count} (${percentage.toFixed(1)}%)</div>
            `;

            container.appendChild(bar);
        });
    },

    renderRecentFiles(files) {
        const container = document.getElementById('recentFilesList');
        container.innerHTML = '';

        if (files.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No hay archivos recientes</p>';
            return;
        }

        files.forEach(file => {
            const item = document.createElement('div');
            item.style.padding = '12px';
            item.style.borderBottom = '1px solid var(--border-color)';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <i class="fas ${UI.getFileIcon(file.mime_type)}" style="color: var(--accent-cyan); font-size: 24px;"></i>
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${file.original_name}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            ${UI.formatFileSize(file.file_size)} • ${file.uploaded_by_name}
                        </div>
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary);">
                        ${UI.formatDate(file.created_at)}
                    </div>
                </div>
            `;

            container.appendChild(item);
        });
    }
};
