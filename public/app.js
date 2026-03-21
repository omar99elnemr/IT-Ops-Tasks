document.addEventListener('DOMContentLoaded', () => {
    // === Core State ===
    let state = {
        userName: '',
        shift: 'Morning (09:00 - 17:00)',
        contacts: [
            // Example structure: { id: 1, name: 'Eng Malak', email: 'malak@domain.com', role: 'none' }
        ],
        fixedTasks: [
            { id: 1, title: 'Checked all IDF rooms', done: false, time: null },
            { id: 2, title: 'Checked IPTV Channels', done: false, time: null },
            { id: 3, title: 'Check All Hosts Health & Storage', done: false, time: null },
            { id: 4, title: 'Checked Landline', done: false, time: null }
        ],
        dynamicTasks: []
    };

    // === Elements ===
    const els = {
        // Settings
        toggleSettingsBtn: document.getElementById('toggleSettingsBtn'),
        settingsPanel: document.getElementById('settingsPanel'),
        userName: document.getElementById('userName'),
        shiftSelect: document.getElementById('shiftSelect'),
        datePicker: document.getElementById('datePicker'),
        
        // Contacts
        contactName: document.getElementById('contactName'),
        contactEmail: document.getElementById('contactEmail'),
        contactRole: document.getElementById('contactRole'),
        addContactBtn: document.getElementById('addContactBtn'),
        contactsContainer: document.getElementById('contactsContainer'),
        
        // Fixed Tasks
        newFixedTaskInput: document.getElementById('newFixedTaskInput'),
        addFixedTaskBtn: document.getElementById('addFixedTaskBtn'),
        fixedTasksList: document.getElementById('fixedTasksList'),
        
        // Dynamic Tasks
        newTaskDesc: document.getElementById('newTaskDesc'),
        newTaskStatus: document.getElementById('newTaskStatus'),
        addDynamicTaskBtn: document.getElementById('addDynamicTaskBtn'),
        dynamicTasksList: document.getElementById('dynamicTasksList'),
        
        // Report
        generateReportBtn: document.getElementById('generateReportBtn'),
        reportContainer: document.getElementById('reportContainer'),
        emailPreview: document.getElementById('emailPreview'),
        copyHtmlBtn: document.getElementById('copyHtmlBtn'),
        openOutlookBtn: document.getElementById('openOutlookBtn'),
        copyMsg: document.getElementById('copyMsg')
    };

    // === Init ===
    init();

    function init() {
        els.datePicker.valueAsDate = new Date();
        loadState();
        setupEvents();
        renderAll();
    }

    function setupEvents() {
        // Settings triggers
        els.toggleSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (els.settingsPanel.style.display === 'none' || els.settingsPanel.style.display === '') {
                els.settingsPanel.style.display = 'block';
            } else {
                els.settingsPanel.style.display = 'none';
            }
        });

        els.userName.addEventListener('input', (e) => { state.userName = e.target.value; saveState(); });
        els.shiftSelect.addEventListener('change', (e) => { state.shift = e.target.value; saveState(); });

        // Contacts
        els.addContactBtn.addEventListener('click', addContact);
        els.contactEmail.addEventListener('keypress', (e) => { if(e.key === 'Enter') addContact(); });
        els.contactName.addEventListener('keypress', (e) => { if(e.key === 'Enter') addContact(); });

        // Fixed Tasks
        els.addFixedTaskBtn.addEventListener('click', addFixedTask);
        els.newFixedTaskInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') addFixedTask(); });

        // Dynamic Tasks
        els.addDynamicTaskBtn.addEventListener('click', addDynamicTask);
        els.newTaskDesc.addEventListener('keypress', (e) => { if(e.key === 'Enter') addDynamicTask(); });

        // Email
        els.generateReportBtn.addEventListener('click', generateEmailPreview);
        els.copyHtmlBtn.addEventListener('click', copyReportToClipboard);
        els.openOutlookBtn.addEventListener('click', openOutlookDraft);
    }

    // === State Management ===
    function loadState() {
        const saved = localStorage.getItem('itOpsState');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Keep the default array if parsed array doesn't exist
                if(parsed.userName) state.userName = parsed.userName;
                if(parsed.shift) state.shift = parsed.shift;
                if(parsed.contacts) state.contacts = parsed.contacts;
                if(parsed.fixedTasks) state.fixedTasks = parsed.fixedTasks;
                if(parsed.dynamicTasks) state.dynamicTasks = parsed.dynamicTasks;
            } catch (e) { console.error('Failed to parse local state'); }
        }
        els.userName.value = state.userName;
        els.shiftSelect.value = state.shift;
    }

    function saveState() {
        localStorage.setItem('itOpsState', JSON.stringify(state));
    }


    // === Contacts System (Fix applied) ===
    function addContact() {
        const name = els.contactName.value.trim();
        const email = els.contactEmail.value.trim();
        const role = els.contactRole.value;

        if (!name || !email) {
            alert('Please provide both Name and Email for the contact.');
            return;
        }

        // Check duplicates
        if (state.contacts.some(c => c.email.toLowerCase() === email.toLowerCase())) {
            alert('A contact with this email already exists!');
            return;
        }

        state.contacts.push({ id: Date.now(), name, email, role });
        
        // Reset Inputs
        els.contactName.value = '';
        els.contactEmail.value = '';
        els.contactRole.value = 'none';
        
        saveState();
        renderContacts();
    }

    function setContactRole(id, roleOption) {
        const c = state.contacts.find(c => c.id === id);
        if(c) {
            c.role = roleOption;
            saveState();
            renderContacts();
        }
    }

    function removeContact(id) {
        if(confirm("Remove this contact?")) {
            state.contacts = state.contacts.filter(c => c.id !== id);
            saveState();
            renderContacts();
        }
    }

    function renderContacts() {
        els.contactsContainer.innerHTML = '';
        if(state.contacts.length === 0) {
            els.contactsContainer.innerHTML = '<span style="font-size:0.85em; color:#999;">No contacts added yet.</span>';
            return;
        }

        state.contacts.forEach(c => {
            const card = document.createElement('div');
            card.className = 'contact-card';
            
            const info = document.createElement('div');
            info.className = 'contact-info';
            info.innerHTML = \`<span class="contact-name">\${c.name}</span><span class="contact-email">\${c.email}</span>\`;

            // Role Badge visualizer for clarity
            if (c.role !== 'none') {
                const badge = document.createElement('span');
                badge.className = 'role-badge ' + c.role;
                badge.innerText = c.role.toUpperCase();
                badge.style.marginTop = '4px';
                badge.style.width = 'fit-content';
                info.appendChild(badge);
            }

            const controls = document.createElement('div');
            controls.style.display = 'flex';
            controls.style.flexDirection = 'column';
            controls.style.gap = '5px';

            const select = document.createElement('select');
            select.style.padding = '4px';
            select.style.fontSize = '0.8em';
            ['none', 'to', 'cc'].forEach(r => {
                const opt = document.createElement('option');
                opt.value = r;
                opt.innerText = r === 'none' ? 'Idle' : r.toUpperCase();
                if(r === c.role) opt.selected = true;
                select.appendChild(opt);
            });
            select.onchange = (e) => setContactRole(c.id, e.target.value);

            const del = document.createElement('button');
            del.className = 'btn-danger btn-icon';
            del.style.padding = '4px';
            del.innerText = 'Del';
            del.onclick = () => removeContact(c.id);

            controls.appendChild(select);
            controls.appendChild(del);

            card.appendChild(info);
            card.appendChild(controls);
            els.contactsContainer.appendChild(card);
        });
    }

    // === Routine Tasks ===
    function addFixedTask() {
        const title = els.newFixedTaskInput.value.trim();
        if(!title) return;
        state.fixedTasks.push({ id: Date.now(), title, done: false, time: null });
        els.newFixedTaskInput.value = '';
        saveState();
        renderFixedTasks();
    }

    function toggleFixedTask(id) {
        const t = state.fixedTasks.find(t => t.id === id);
        if(t) {
            t.done = !t.done;
            t.time = t.done ? getEgyptTime() : null;
            saveState();
            renderFixedTasks();
        }
    }

    function removeFixedTask(id) {
        if(confirm("Delete this routine task permanently?")) {
            state.fixedTasks = state.fixedTasks.filter(t => t.id !== id);
            saveState();
            renderFixedTasks();
        }
    }

    function editFixedTask(id) {
        const t = state.fixedTasks.find(t => t.id === id);
        if(t) {
            const newTitle = prompt("Edit Routine Task:", t.title);
            if(newTitle && newTitle.trim() !== "") {
                t.title = newTitle.trim();
                saveState();
                renderFixedTasks();
            }
        }
    }

    function renderFixedTasks() {
        els.fixedTasksList.innerHTML = '';
        state.fixedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-row';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'task-content';
            contentDiv.innerHTML = \`
                <span class="task-title \${task.done ? 'strikethrough' : ''}">\${task.title}</span>
                <span class="task-meta">\${task.done ? '✅ Completed at ' + task.time : '⏳ Pending'}</span>
            \`;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';

            const doneBtn = document.createElement('button');
            doneBtn.className = task.done ? 'btn-outline' : 'btn-success';
            doneBtn.innerText = task.done ? 'Undo' : 'Mark Done';
            doneBtn.onclick = () => toggleFixedTask(task.id);

            const editBtn = document.createElement('button');
            editBtn.className = 'btn-outline';
            editBtn.innerText = 'Edit';
            editBtn.onclick = () => editFixedTask(task.id);

            const delBtn = document.createElement('button');
            delBtn.className = 'btn-danger';
            delBtn.innerText = 'X';
            delBtn.onclick = () => removeFixedTask(task.id);

            actionsDiv.appendChild(doneBtn);
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(delBtn);

            li.appendChild(contentDiv);
            li.appendChild(actionsDiv);
            els.fixedTasksList.appendChild(li);
        });
    }

    // === Dynamic Tasks ===
    function addDynamicTask() {
        const desc = els.newTaskDesc.value.trim();
        const stat = els.newTaskStatus.value;
        if(!desc) return;
        
        state.dynamicTasks.push({ id: Date.now(), title: desc, status: stat, time: getEgyptTime() });
        els.newTaskDesc.value = '';
        saveState();
        renderDynamicTasks();
    }

    function moveToRoutine(id) {
        const idx = state.dynamicTasks.findIndex(t => t.id === id);
        if (idx > -1) {
            const task = state.dynamicTasks[idx];
            state.fixedTasks.push({ id: Date.now(), title: task.title, done: task.status === 'Completed', time: task.status === 'Completed' ? task.time : null });
            state.dynamicTasks.splice(idx, 1);
            saveState();
            renderAll();
        }
    }

    function removeDynamicTask(id) {
        state.dynamicTasks = state.dynamicTasks.filter(t => t.id !== id);
        saveState();
        renderDynamicTasks();
    }

    function renderDynamicTasks() {
        els.dynamicTasksList.innerHTML = '';
        state.dynamicTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-row';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'task-content';
            contentDiv.innerHTML = \`
                <div class="flex" style="flex-wrap: wrap;">
                    <span class="status-badge status-\${task.status.toLowerCase()}">\${task.status}</span>
                    <span class="task-title">\${task.title}</span>
                </div>
                <span class="task-meta">Logged at \${task.time}</span>
            \`;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';

            const makeRoutineBtn = document.createElement('button');
            makeRoutineBtn.className = 'btn-outline';
            makeRoutineBtn.innerText = 'Make Routine';
            makeRoutineBtn.onclick = () => moveToRoutine(task.id);

            const delBtn = document.createElement('button');
            delBtn.className = 'btn-danger';
            delBtn.innerText = 'Del';
            delBtn.onclick = () => removeDynamicTask(task.id);

            actionsDiv.appendChild(makeRoutineBtn);
            actionsDiv.appendChild(delBtn);

            li.appendChild(contentDiv);
            li.appendChild(actionsDiv);
            els.dynamicTasksList.appendChild(li);
        });
    }

    // === Core View Helpers ===
    function getEgyptTime() {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('en-EG', {
            timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false
        });
        return formatter.format(date);
    }
    
    function getFormattedDate() {
        const d = els.datePicker.valueAsDate || new Date();
        return \`\${d.getDate()}-\${d.getMonth() + 1}-\${d.getFullYear()}\`;
    }

    function renderAll() {
        renderContacts();
        renderFixedTasks();
        renderDynamicTasks();
    }

    // === Email Construction ===
    function generateEmailHTML() {
        const _date = getFormattedDate();
        
        // Construct Greeting TO Names
        const toContacts = state.contacts.filter(c => c.role === 'to');
        const greetingNames = toContacts.length > 0 
                                ? toContacts.map(c => c.name).join(' & ') 
                                : 'Management';

        let html = \`<div style="font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 14pt; color: #000;">\`;
        
        html += \`<p>Dear <strong>\${greetingNames}</strong>,</p>\`;
        html += \`<p>After greetings,<br>Please find the IT Operations Shift Handover tasks for <strong>\${_date}</strong> below:</p>\`;

        // 1. Routine Verification
        const doneFixed = state.fixedTasks.filter(t => t.done);
        html += \`<p><strong>1. Routine Verification completed:</strong></p>\`;
        html += \`<ul>\`;
        if (doneFixed.length > 0) {
            doneFixed.forEach(t => { html += \`<li>\${t.title} (\${t.time})</li>\`; });
        } else {
            html += \`<li><em>No routine tasks signed off.</em></li>\`;
        }
        html += \`</ul>\`;

        // 2. Executed Tasks (Completed)
        const doneDynamics = state.dynamicTasks.filter(t => t.status === 'Completed');
        html += \`<p><strong>2. Executed Tasks & Incidents:</strong></p>\`;
        if (doneDynamics.length > 0) {
             html += \`<ol>\`;
             doneDynamics.forEach(t => { html += \`<li>\${t.title} (\${t.time})</li>\`; });
             html += \`</ol>\`;
        } else {
             html += \`<p style="margin-left: 20px;"><em>Smooth Operation till end of shift.</em></p>\`;
        }

        // 3. Pending & Handover
        const pendFixed = state.fixedTasks.filter(t => !t.done);
        const pendDynamics = state.dynamicTasks.filter(t => t.status !== 'Completed');
        
        if (pendFixed.length > 0 || pendDynamics.length > 0) {
            html += \`<br><p><strong>Handover & Pending:</strong></p><ul>\`;
            pendDynamics.forEach(t => {
                html += \`<li><strong>[\${t.status.toUpperCase()}]</strong> \${t.title}</li>\`;
            });
            pendFixed.forEach(t => {
                html += \`<li>[PENDING ROUTINE] \${t.title}</li>\`;
            });
            html += \`</ul>\`;
        }

        // Signature
        html += \`<br><p>\${state.userName || 'IT Operations'}<br/>IT Senior Supervisor</p>\`;
        html += \`</div>\`;

        return html;
    }

    function generateEmailPreview() {
        els.emailPreview.innerHTML = generateEmailHTML();
        els.reportContainer.style.display = 'block';
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    async function copyReportToClipboard() {
        try {
            const htmlBlob = new Blob([els.emailPreview.innerHTML], { type: 'text/html' });
            const textBlob = new Blob([els.emailPreview.innerText], { type: 'text/plain' });
            
            await navigator.clipboard.write([
                new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
            ]);

            els.copyMsg.style.display = 'block';
            setTimeout(() => els.copyMsg.style.display = 'none', 5000);
        } catch (err) {
            alert('Failed to copy natively. Please click inside the box and hit Ctrl+C.');
            console.error(err);
        }
    }

    function openOutlookDraft() {
        generateEmailPreview(); // ensure up to date

        const TO_emails = state.contacts.filter(c => c.role === 'to').map(c => c.email).join(';');
        const CC_emails = state.contacts.filter(c => c.role === 'cc').map(c => c.email).join(';');
        
        const subject = encodeURIComponent(\`Completed Tasks for operation today \${getFormattedDate()}\`);
        
        // Start copying to clipboard silently so they don't have to do it manually
        copyReportToClipboard().then(() => {
            const mailtoLink = \`mailto:\${TO_emails}?cc=\${CC_emails}&subject=\${subject}\`;
            window.location.href = mailtoLink;
        });
    }

});