import * as XLSX from 'xlsx';

const API_BASE = '/api'
const API = {
   TASKS: `${API_BASE}/distinctName`,
   HIDE_TASK: '/hideTask',
   UPLOAD_WPS: '/uploadWPS',  // Direct endpoint without /api prefix
   UPLOAD_DATA: `${API_BASE}/uploadData`,
   DOWNLOAD_DATA: '/downloadData' // This endpoint doesn't use /api prefix
}

// State Management
const state = {
    tasks: [],
    filteredTasks: [],
    selectedTask: null,
    currentPage: 1,
    itemsPerPage: 10,
    sortBy: 'name',
    loading: false,
    uploadController: null
};

// DOM Elements
const elements = {
    taskList: document.getElementById('taskList'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    perPage: document.getElementById('perPage'),
    currentPage: document.getElementById('currentPage'),
    totalPages: document.getElementById('totalPages'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageNumbers: document.getElementById('pageNumbers'),
    loadTaskBtn: document.getElementById('loadTaskBtn'),
    loadVpsBtn: document.getElementById('loadVpsBtn'),
    downloadTaskBtn: document.getElementById('downloadTaskBtn'),
    statusText: document.getElementById('statusText'),
    currentTime: document.getElementById('currentTime'),
    fileInput: document.getElementById('fileInput'),
    progressModal: document.getElementById('progressModal'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    cancelUpload: document.getElementById('cancelUpload'),
    confirmModal: document.getElementById('confirmModal'),
    confirmText: document.getElementById('confirmText'),
    confirmOk: document.getElementById('confirmOk'),
    confirmCancel: document.getElementById('confirmCancel'),
    toastContainer: document.getElementById('toastContainer')
};

// Utility Functions
const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

const formatDate = (date) => {
    return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
};

// Toast Notifications
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(100%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Task Item Template
const createTaskItem = (task, index) => {
    const div = document.createElement('div');
    div.className = 'task-item group';
    div.dataset.task = task;
    
    if (task === state.selectedTask) {
        div.classList.add('selected');
    }
    
    div.innerHTML = `
        <span class="task-item-icon">📄</span>
        <div class="flex-1">
            <div class="task-item-text">${index + 1}. ${task}</div>
            <div class="text-sm text-gray-400">Добавлено: ${formatDate(new Date())}</div>
        </div>
        <button class="hide-button" data-task="${task}" title="Скрыть задание">✖</button>
    `;
    
    return div;
};

// Pagination
const updatePagination = () => {
    const totalItems = state.filteredTasks.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    
    elements.currentPage.textContent = state.currentPage;
    elements.totalPages.textContent = totalPages;
    elements.prevPage.disabled = state.currentPage === 1;
    elements.nextPage.disabled = state.currentPage === totalPages;
    
    // Update page numbers
    elements.pageNumbers.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || 
            i === totalPages || 
            (i >= state.currentPage - 1 && i <= state.currentPage + 1)
        ) {
            const button = document.createElement('button');
            button.className = `pagination-btn ${i === state.currentPage ? 'active' : ''}`;
            button.textContent = i;
            button.onclick = () => goToPage(i);
            elements.pageNumbers.appendChild(button);
        } else if (
            i === state.currentPage - 2 || 
            i === state.currentPage + 2
        ) {
            const span = document.createElement('span');
            span.className = 'px-2 text-gray-400';
            span.textContent = '...';
            elements.pageNumbers.appendChild(span);
        }
    }
};

const goToPage = (page) => {
    state.currentPage = page;
    renderTasks();
    updatePagination();
};

// Task Rendering
const renderTasks = () => {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const tasksToShow = state.filteredTasks.slice(start, end);
    
    elements.taskList.innerHTML = '';
    tasksToShow.forEach((task, index) => {
        const taskElement = createTaskItem(task, start + index + 1);
        elements.taskList.appendChild(taskElement);
    });
    
    updateStatus();
};

const updateStatus = () => {
    elements.statusText.textContent = `Загружено заданий: ${state.tasks.length}`;
    elements.currentTime.textContent = formatDate(new Date());
};

// Loading States
const setLoading = (loading) => {
    state.loading = loading;
    elements.taskList.classList.toggle('opacity-50', loading);
    
    // Show/hide skeleton loading
    const skeletons = elements.taskList.querySelectorAll('.skeleton-task');
    skeletons.forEach(skeleton => {
        skeleton.classList.toggle('hidden', !loading);
    });
};

// API Functions
const fetchTasks = async () => {
    try {
        setLoading(true);
        const response = await fetch(API.TASKS);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        if (!data.success || !data.data) throw new Error('No data available');
        
        state.tasks = data.data;
        state.filteredTasks = [...state.tasks];
        renderTasks();
        updatePagination();
        showToast('Список заданий успешно загружен');
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showToast('Ошибка при загрузке списка заданий', 'error');
    } finally {
        setLoading(false);
    }
};

const hideTask = async (taskName) => {
    try {
        const response = await fetch(API.HIDE_TASK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nazvanie_zdaniya: taskName })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        state.tasks = state.tasks.filter(task => task !== taskName);
        state.filteredTasks = state.filteredTasks.filter(task => task !== taskName);
        
        renderTasks();
        updatePagination();
        showToast('Задание успешно скрыто');
    } catch (error) {
        console.error('Error hiding task:', error);
        showToast('Ошибка при скрытии задания', 'error');
    }
};

// File Upload
const uploadFile = async (file, isWps = false) => {
    try {
        state.uploadController = new AbortController();
        showProgress();

        // Read Excel file
        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });

        if (!data || data.length === 0) {
            throw new Error('Файл пустой');
        }

        const totalRows = data.length;
        let processedRows = 0;

        // Get prefix from filename
        const pref = file.name.split(' ')[0];

        // Process each row
        for (const row of data) {
            if (state.uploadController.signal.aborted) {
                throw new Error('AbortError');
            }

            const payload = isWps ? {
                'nazvanie_zdaniya': row['Название задания'] || '',
                'artikul': row['Артикул'] || '',
                'shk': String(row['Штрих-код'] || '').replace('.0', ''),
                'mesto': row['Место'] || '',
                'vlozhennost': row['Вложенность'] || '',
                'pallet': row['Паллет'] || '',
                'size_vps': row['Размер ВПС'] || '',
                'vp': row['ВП'] || '',
                'itog_zakaza': row['Итог заказа'],
                'shk_wps': String(row['ШК ВПС'] || '')
            } : {
                'Artikul': row['Артикул'] || '',
                'Nazvanie_Tovara': row['Название товара'] || '',
                'SHK': row['ШК'] || '',
                'Nomenklatura': row['Номенклатура'] || '',
                'Itog_Zakaz': row['Итог Заказ'],
                'Srok_Godnosti': row['Срок Годности'] || '',
                'pref': pref,
                'Status': 0,
                'Status_Zadaniya': 0,
                'Nazvanie_Zadaniya': file.name,
                'vp': row['ВП'] || ''
            };

            // Clean null/undefined values
            Object.keys(payload).forEach(key => {
                if (payload[key] === null || payload[key] === undefined) {
                    payload[key] = '';
                }
            });

            let success = false;
            let retries = 0;
            const maxRetries = 3;

            while (!success && retries < maxRetries) {
                try {
                    const response = await fetch(isWps ? API.UPLOAD_WPS : API.UPLOAD_DATA, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        signal: state.uploadController.signal
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    success = true;
                } catch (error) {
                    retries++;
                    if (retries === maxRetries) throw error;
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                }
            }

            processedRows++;
            updateProgress((processedRows / totalRows) * 100);
        }

        hideProgress();
        showToast('Файл успешно загружен');
        await fetchTasks();
    } catch (error) {
        if (error.name === 'AbortError' || error.message === 'AbortError') {
            showToast('Загрузка отменена', 'error');
        } else {
            console.error('Error uploading file:', error);
            showToast('Ошибка при загрузке файла: ' + error.message, 'error');
        }
        hideProgress();
    }
};

// Progress Modal
const showProgress = () => {
    elements.progressModal.classList.remove('hidden');
    elements.progressModal.querySelector('.modal-content').classList.add('active');
};

const hideProgress = () => {
    elements.progressModal.querySelector('.modal-content').classList.remove('active');
    setTimeout(() => elements.progressModal.classList.add('hidden'), 300);
};

const updateProgress = (percentage) => {
    elements.progressBar.style.width = `${percentage}%`;
    elements.progressText.textContent = `${Math.round(percentage)}%`;
};

// Confirmation Modal
const showConfirm = (message) => {
    return new Promise((resolve) => {
        elements.confirmText.textContent = message;
        elements.confirmModal.classList.remove('hidden');
        elements.confirmModal.querySelector('.modal-content').classList.add('active');
        
        const handleConfirm = (result) => {
            elements.confirmModal.querySelector('.modal-content').classList.remove('active');
            setTimeout(() => elements.confirmModal.classList.add('hidden'), 300);
            resolve(result);
        };
        
        const onOk = () => handleConfirm(true);
        const onCancel = () => handleConfirm(false);
        
        elements.confirmOk.onclick = onOk;
        elements.confirmCancel.onclick = onCancel;
    });
};

// Функция для расчета расхождений по артикулам
const calculateArtikulDiscrepancies = (data) => {
    // Группируем данные по артикулу
    const artikulGroups = {};
    
    data.forEach(row => {
        const artikul = row.artikul || '';
        if (!artikulGroups[artikul]) {
            artikulGroups[artikul] = {
                artikul: artikul,
                nazvanie_tovara: row.nazvanie_tovara || '',
                itog_zakaza: 0,
                vlozhennost: 0,
                size_vps: 0
            };
        }
        
        // Суммируем значения для каждого артикула
        artikulGroups[artikul].itog_zakaza += Number(row.itog_zakaza) || 0;
        artikulGroups[artikul].vlozhennost += Number(row.vlozhennost) || 0;
        artikulGroups[artikul].size_vps += Number(row.size_vps) || 0;
    });
    
    // Преобразуем в массив и рассчитываем расхождения
    return Object.values(artikulGroups).map(group => {
        const itogZakaza = group.itog_zakaza;
        const vlozhennost = group.vlozhennost;
        const sizeVps = group.size_vps;
        
        return {
            'Артикул': group.artikul,
            'Название товара': group.nazvanie_tovara,
            'Итог заказа': itogZakaza,
            'Вложенность': vlozhennost,
            'Размер ВПС': sizeVps,
            'Расхождение заказ/упаковано': itogZakaza - vlozhennost,
            'Расхождение ВП/упаковано': sizeVps - vlozhennost
        };
    });
};

// Event Listeners
elements.searchInput.addEventListener('input', debounce((e) => {
    const searchText = e.target.value.toLowerCase();
    state.filteredTasks = state.tasks.filter(task => 
        task.toLowerCase().includes(searchText)
    );
    state.currentPage = 1;
    renderTasks();
    updatePagination();
}, 300));

elements.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    state.filteredTasks.sort((a, b) => {
        if (state.sortBy === 'name') {
            return a.localeCompare(b);
        } else {
            // Assuming we have dates, add date sorting logic here
            return 0;
        }
    });
    renderTasks();
});

elements.perPage.addEventListener('change', (e) => {
    state.itemsPerPage = Number(e.target.value);
    state.currentPage = 1;
    renderTasks();
    updatePagination();
});

elements.prevPage.addEventListener('click', () => {
    if (state.currentPage > 1) {
        goToPage(state.currentPage - 1);
    }
});

elements.nextPage.addEventListener('click', () => {
    const totalPages = Math.ceil(state.filteredTasks.length / state.itemsPerPage);
    if (state.currentPage < totalPages) {
        goToPage(state.currentPage + 1);
    }
});

elements.taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('hide-button')) {
        const taskName = e.target.dataset.task;
        hideTask(taskName);
    } else {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            const taskName = taskItem.dataset.task;
            state.selectedTask = taskName;
            document.querySelectorAll('.task-item').forEach(item => {
                item.classList.toggle('selected', item.dataset.task === taskName);
            });
        }
    }
});

elements.loadTaskBtn.addEventListener('click', () => {
    elements.fileInput.accept = '.xlsx';
    elements.fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) uploadFile(file, false);
    };
    elements.fileInput.click();
});

elements.loadVpsBtn.addEventListener('click', () => {
    elements.fileInput.accept = '.xlsx';
    elements.fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) uploadFile(file, true);
    };
    elements.fileInput.click();
});

elements.downloadTaskBtn.addEventListener('click', async () => {
    if (!state.selectedTask) {
        showToast('Пожалуйста, выберите задание из списка', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API.DOWNLOAD_DATA}?task=${encodeURIComponent(state.selectedTask)}`);
        if (!response.ok) throw new Error('Download failed');
        
        const data = await response.json();
        if (!data.success || !Array.isArray(data.data)) {
            throw new Error('Invalid data format');
        }

        // Сформировать Excel на клиенте с помощью SheetJS
        const wb = XLSX.utils.book_new();
        
        // Основной лист без расчетов расхождений
        const rows = data.data.map(row => {
            return {
                'Артикул': row.artikul ?? '',
                'Штрих-код': row.shk ?? '',
                'Вложенность': row.vlozhennost ?? '',
                'Паллет': row.pallet ?? '',
                'ШК ВПС': row.shk_wps ?? '',
                'Размер ВПС': row.size_vps ?? '',
                'ВП': row.vp ?? '',
                'Итог заказа': row.itog_zakaza ?? '',
                'Срок годности': row.srok_godnosti ?? '',
                'Название товара': row.nazvanie_tovara ?? '',
                'Номенклатура': row.Nomenklatura ?? '',
                'Название задания': row.nazvanie_zdaniya ?? ''
            };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        
        // Set default font size for entire worksheet
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (ws[cellAddress]) {
                    if (!ws[cellAddress].s) ws[cellAddress].s = {};
                    if (!ws[cellAddress].s.font) ws[cellAddress].s.font = {};
                    ws[cellAddress].s.font.size = 12;
                }
            }
        }
        
        // Set column widths
        const colWidths = [
            { wch: 15 }, // Артикул
            { wch: 20 }, // Штрих-код
            { wch: 12 }, // Вложенность
            { wch: 12 }, // Паллет
            { wch: 15 }, // ШК ВПС
            { wch: 12 }, // Размер ВПС
            { wch: 8 },  // ВП
            { wch: 12 }, // Итог заказа
            { wch: 15 }, // Срок годности
            { wch: 30 }, // Название товара
            { wch: 20 }, // Номенклатура
            { wch: 25 }  // Название задания
        ];
        ws['!cols'] = colWidths;
        
        // Make header row bold
        const headerRange = XLSX.utils.decode_range(ws['!ref']);
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (ws[cellAddress]) {
                ws[cellAddress].s = { 
                    font: { bold: true, size: 12, color: { rgb: '000000' }},
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }
        }
        
        // Set header row style
        if (!ws['!rows']) ws['!rows'] = [];
        ws['!rows'][0] = { hpt: 20, s: { font: { bold: true } } };
        
        // Создание листа с расчетами по артикулам
        const artikulCalculations = calculateArtikulDiscrepancies(data.data);
        const wsCalculations = XLSX.utils.json_to_sheet(artikulCalculations);
        
        // Настройка стилей для листа расчетов
        const calcRange = XLSX.utils.decode_range(wsCalculations['!ref']);
        for (let row = calcRange.s.r; row <= calcRange.e.r; row++) {
            for (let col = calcRange.s.c; col <= calcRange.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (wsCalculations[cellAddress]) {
                    if (!wsCalculations[cellAddress].s) wsCalculations[cellAddress].s = {};
                    if (!wsCalculations[cellAddress].s.font) wsCalculations[cellAddress].s.font = {};
                    wsCalculations[cellAddress].s.font.size = 12;
                }
            }
        }
        
        // Настройка ширины колонок для листа расчетов
        const calcColWidths = [
            { wch: 15 }, // Артикул
            { wch: 30 }, // Название товара
            { wch: 12 }, // Итог заказа
            { wch: 12 }, // Вложенность
            { wch: 12 }, // Размер ВПС
            { wch: 25 }, // Расхождение заказ/упаковано
            { wch: 25 }  // Расхождение ВП/упаковано
        ];
        wsCalculations['!cols'] = calcColWidths;
        
        // Стилизация заголовков для листа расчетов
        for (let col = calcRange.s.c; col <= calcRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (wsCalculations[cellAddress]) {
                wsCalculations[cellAddress].s = { 
                    font: { bold: true, size: 12, color: { rgb: '000000' }},
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }
        }
        
        // Настройка высоты строки заголовка для листа расчетов
        if (!wsCalculations['!rows']) wsCalculations['!rows'] = [];
        wsCalculations['!rows'][0] = { hpt: 20, s: { font: { bold: true } } };
        
        XLSX.utils.book_append_sheet(wb, ws, 'Задание');
        XLSX.utils.book_append_sheet(wb, wsCalculations, 'Расчеты по артикулам');
        XLSX.writeFile(wb, `${state.selectedTask}.xlsx`);
        
        showToast('Файл успешно сформирован');
    } catch (error) {
        console.error('Error generating file:', error);
        showToast('Ошибка при формировании файла', 'error');
    }
});

elements.cancelUpload.addEventListener('click', () => {
    if (state.uploadController) {
        state.uploadController.abort();
    }
});

// Update current time every second
setInterval(() => {
    elements.currentTime.textContent = formatDate(new Date());
}, 1000);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
});