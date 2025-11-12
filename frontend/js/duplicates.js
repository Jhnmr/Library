// Gestión de Duplicados

const Duplicates = {
    async loadDuplicates() {
        try {
            UI.showLoading();
            const response = await api.findDuplicates();
            this.renderDuplicates(response.data);
            UI.hideLoading();
        } catch (error) {
            console.error('Error loading duplicates:', error);
            UI.showToast('Error al cargar duplicados', 'error');
            UI.hideLoading();
        }
    },

    renderDuplicates(data) {
        const summary = document.getElementById('duplicatesSummary');
        const container = document.getElementById('duplicatesContainer');

        // Resumen
        summary.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-copy"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${data.summary.duplicate_groups}</h3>
                        <p>Grupos de Duplicados</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-files"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${data.summary.total_duplicate_files}</h3>
                        <p>Archivos Duplicados</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-hdd"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${UI.formatFileSize(data.summary.total_wasted_space)}</h3>
                        <p>Espacio Recuperable</p>
                    </div>
                </div>
            </div>
        `;

        // Lista de duplicados
        container.innerHTML = '';

        if (data.duplicates.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-check-circle" style="font-size: 64px; color: var(--accent-green); margin-bottom: 20px;"></i>
                    <p style="font-size: 18px;">No hay archivos duplicados</p>
                    <p>Tu biblioteca está optimizada</p>
                </div>
            `;
            return;
        }

        data.duplicates.forEach(dup => {
            const group = document.createElement('div');
            group.style.background = 'var(--bg-secondary)';
            group.style.border = '1px solid var(--border-color)';
            group.style.borderRadius = '12px';
            group.style.padding = '20px';
            group.style.marginBottom = '20px';

            const header = document.createElement('div');
            header.style.marginBottom = '15px';
            header.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4>${dup.files[0].original_name}</h4>
                    <span style="color: var(--accent-red);">
                        ${dup.count} copias • ${UI.formatFileSize(dup.wasted_space)} recuperable
                    </span>
                </div>
            `;

            const filesList = document.createElement('div');
            filesList.style.display = 'grid';
            filesList.style.gap = '12px';

            dup.files.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.style.padding = '12px';
                fileItem.style.background = 'var(--bg-tertiary)';
                fileItem.style.borderRadius = '8px';
                fileItem.style.display = 'flex';
                fileItem.style.justifyContent = 'space-between';
                fileItem.style.alignItems = 'center';

                fileItem.innerHTML = `
                    <div>
                        <div>${file.original_name}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            ${file.folder_name || 'Raíz'} • ${file.uploaded_by_name} • ${UI.formatDate(file.created_at)}
                        </div>
                    </div>
                    <div>
                        ${index === 0 ? '<span style="color: var(--accent-green); font-weight: 600;">Original</span>' : ''}
                        ${index > 0 ? `<button class="btn btn-danger" style="padding: 6px 12px;" onclick="Duplicates.deleteDuplicate(${dup.files[0].id}, [${file.id}])"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                `;

                filesList.appendChild(fileItem);
            });

            if (dup.files.length > 1) {
                const actions = document.createElement('div');
                actions.style.marginTop = '15px';
                actions.style.textAlign = 'right';

                const deleteAllBtn = document.createElement('button');
                deleteAllBtn.className = 'btn btn-danger';
                deleteAllBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Eliminar todas las copias';
                deleteAllBtn.onclick = () => {
                    const keepId = dup.files[0].id;
                    const deleteIds = dup.files.slice(1).map(f => f.id);
                    this.deleteDuplicate(keepId, deleteIds);
                };

                actions.appendChild(deleteAllBtn);
                group.appendChild(header);
                group.appendChild(filesList);
                group.appendChild(actions);
            } else {
                group.appendChild(header);
                group.appendChild(filesList);
            }

            container.appendChild(group);
        });
    },

    async deleteDuplicate(keepFileId, deleteFileIds) {
        if (!confirm(`¿Eliminar ${deleteFileIds.length} archivo(s) duplicado(s)?`)) {
            return;
        }

        try {
            const response = await api.resolveDuplicates(keepFileId, deleteFileIds);
            UI.showToast(response.message, 'success');
            this.loadDuplicates();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
};

// Event Listeners
document.getElementById('scanDuplicatesBtn').addEventListener('click', () => {
    Duplicates.loadDuplicates();
});
