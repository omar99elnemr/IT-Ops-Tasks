const { useState, useEffect, useMemo } = React;

const API = {
  async request(path, { method = 'GET', token, body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error?.message || `Request failed: ${response.status}`);
    }
    return data;
  },
  login(email, password) {
    return API.request('/api/auth/login', { method: 'POST', body: { email, password } });
  },
  register(payload) {
    return API.request('/api/auth/register', { method: 'POST', body: payload });
  },
  getContacts(token) {
    return API.request('/api/contacts', { token });
  },
  addContact(token, payload) {
    return API.request('/api/contacts', { method: 'POST', token, body: payload });
  },
  updateContact(token, id, payload) {
    return API.request(`/api/contacts/${id}`, { method: 'PATCH', token, body: payload });
  },
  deleteContact(token, id) {
    return API.request(`/api/contacts/${id}`, { method: 'DELETE', token });
  },
  getTasks(token) {
    return API.request('/api/tasks', { token });
  },
  addTask(token, payload) {
    return API.request('/api/tasks', { method: 'POST', token, body: payload });
  },
  updateTask(token, id, payload) {
    return API.request(`/api/tasks/${id}`, { method: 'PATCH', token, body: payload });
  },
  deleteTask(token, id) {
    return API.request(`/api/tasks/${id}`, { method: 'DELETE', token });
  },
  resetDynamicTasks(token) {
    return API.request('/api/tasks/reset/dynamic', { method: 'POST', token });
  },
  generateReport(token, payload) {
    return API.request('/api/reports/generate', { method: 'POST', token, body: payload });
  },
};

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    preferredShift: 'morning',
  });

  async function submitLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await API.login(loginForm.email, loginForm.password);
      onAuthenticated(result.data.token, result.data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await API.register(registerForm);
      onAuthenticated(result.data.token, result.data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card reveal">
        <h1>IT Ops Control Deck</h1>
        <p className="subtitle">Shift handover, now API-powered and account-scoped.</p>

        <div className="segmented">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={submitLogin} className="form-stack">
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
            <button disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="form-stack">
            <div className="two-col">
              <input
                type="text"
                placeholder="First name"
                value={registerForm.firstName}
                onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Last name"
                value={registerForm.lastName}
                onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              required
            />
            <select
              value={registerForm.preferredShift}
              onChange={(e) => setRegisterForm({ ...registerForm, preferredShift: e.target.value })}
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
            <button disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function Dashboard({ token, user, onLogout }) {
  const [contacts, setContacts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTaskFilter, setActiveTaskFilter] = useState('all');
  const [preferredShift, setPreferredShift] = useState(user.preferredShift || 'morning');

  const [contactForm, setContactForm] = useState({ name: '', email: '', role: 'to' });
  const [taskForm, setTaskForm] = useState({
    title: '',
    type: 'dynamic',
    status: 'in_progress',
    time: '',
  });

  const filteredTasks = useMemo(() => {
    if (activeTaskFilter === 'all') return tasks;
    return tasks.filter((task) => task.type === activeTaskFilter);
  }, [tasks, activeTaskFilter]);

  const counts = useMemo(() => {
    return {
      contacts: contacts.length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      handover: tasks.filter((t) => t.status === 'handed_over').length,
    };
  }, [contacts, tasks]);

  async function refresh() {
    setError('');
    try {
      const [contactsRes, tasksRes] = await Promise.all([
        API.getContacts(token),
        API.getTasks(token),
      ]);
      setContacts(contactsRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createContact(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await API.addContact(token, contactForm);
      setContactForm({ name: '', email: '', role: 'to' });
      setMessage('Contact saved.');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function createTask(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await API.addTask(token, {
        ...taskForm,
        time: taskForm.time || undefined,
      });
      setTaskForm({ title: '', type: 'dynamic', status: 'in_progress', time: '' });
      setMessage('Task saved.');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function buildReport() {
    setBusy(true);
    setError('');
    try {
      const result = await API.generateReport(token, {
        userName: `${user.firstName} ${user.lastName}`.trim(),
        shift: preferredShift,
      });
      setReport(result.data);
      setMessage('Report generated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeContact(id) {
    if (!window.confirm('Delete this contact?')) return;
    setBusy(true);
    setError('');
    try {
      await API.deleteContact(token, id);
      setMessage('Contact deleted.');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeContactRole(contact, role) {
    setBusy(true);
    setError('');
    try {
      await API.updateContact(token, contact.id, { role });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeTask(id) {
    if (!window.confirm('Delete this task?')) return;
    setBusy(true);
    setError('');
    try {
      await API.deleteTask(token, id);
      setMessage('Task deleted.');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateTaskStatus(task, status) {
    setBusy(true);
    setError('');
    try {
      await API.updateTask(token, task.id, { status });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetDynamic() {
    if (!window.confirm('Delete all dynamic tasks?')) return;
    setBusy(true);
    setError('');
    try {
      await API.resetDynamicTasks(token);
      setMessage('Dynamic tasks reset complete.');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyReportText() {
    if (!report?.textBody) return;
    try {
      await navigator.clipboard.writeText(report.textBody);
      setMessage('Report text copied.');
    } catch (_error) {
      setError('Failed to copy report text.');
    }
  }

  function openMailDraft() {
    if (!report) return;
    const to = encodeURIComponent((report.recipients || []).join(';'));
    const cc = encodeURIComponent((report.cc || []).join(';'));
    const subject = encodeURIComponent(report.subject || 'IT Ops Handover');
    window.location.href = `mailto:${to}?cc=${cc}&subject=${subject}`;
  }

  return (
    <div className="deck-shell reveal">
      <header className="topbar">
        <div>
          <h2>Welcome, {user.firstName}</h2>
          <p>{user.email}</p>
        </div>
        <button className="outline" onClick={onLogout}>Logout</button>
      </header>

      {error && <div className="error-box">{error}</div>}
      {message && <div className="error-box" style={{ color: '#0b7d87', borderColor: '#8ed9d9', background: '#ecffff' }}>{message}</div>}

      <section className="panel" style={{ marginBottom: 12 }}>
        <h3>Shift Settings</h3>
        <div className="two-col" style={{ marginTop: 10 }}>
          <select value={preferredShift} onChange={(e) => setPreferredShift(e.target.value)}>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
          <button className="outline" onClick={resetDynamic} disabled={busy}>Reset Dynamic Tasks</button>
        </div>
      </section>

      <section className="kpis">
        <article><strong>{counts.contacts}</strong><span>Contacts</span></article>
        <article><strong>{counts.completed}</strong><span>Completed</span></article>
        <article><strong>{counts.inProgress}</strong><span>In Progress</span></article>
        <article><strong>{counts.handover}</strong><span>Handed Over</span></article>
      </section>

      <section className="grid two">
        <div className="panel">
          <h3>Add Contact</h3>
          <form onSubmit={createContact} className="form-stack">
            <input placeholder="Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
            <input type="email" placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
            <select value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}>
              <option value="to">TO</option>
              <option value="cc">CC</option>
              <option value="none">None</option>
            </select>
            <button disabled={busy}>{busy ? 'Saving...' : 'Save Contact'}</button>
          </form>
        </div>

        <div className="panel">
          <h3>Add Task</h3>
          <form onSubmit={createTask} className="form-stack">
            <input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
            <div className="two-col">
              <select value={taskForm.type} onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}>
                <option value="dynamic">Dynamic</option>
                <option value="fixed">Fixed</option>
              </select>
              <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="handed_over">Handed Over</option>
              </select>
            </div>
            <input placeholder="Time (HH:mm) optional" value={taskForm.time} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} />
            <button disabled={busy}>{busy ? 'Saving...' : 'Save Task'}</button>
          </form>
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <h3>Contacts</h3>
          <ul className="list">
            {contacts.map((c) => (
              <li key={c.id}>
                <span>{c.name}</span>
                <small>{c.email}</small>
                <div className="two-col" style={{ marginTop: 6 }}>
                  <select value={c.role} onChange={(e) => changeContactRole(c, e.target.value)}>
                    <option value="to">TO</option>
                    <option value="cc">CC</option>
                    <option value="none">None</option>
                  </select>
                  <button className="outline" onClick={() => removeContact(c.id)}>Delete</button>
                </div>
              </li>
            ))}
            {contacts.length === 0 && <li><small>No contacts yet.</small></li>}
          </ul>
        </div>

        <div className="panel">
          <h3>Tasks</h3>
          <div className="segmented" style={{ marginBottom: 10 }}>
            <button className={activeTaskFilter === 'all' ? 'active' : ''} onClick={() => setActiveTaskFilter('all')}>All</button>
            <button className={activeTaskFilter === 'fixed' ? 'active' : ''} onClick={() => setActiveTaskFilter('fixed')}>Fixed</button>
          </div>
          <div className="segmented" style={{ marginBottom: 10 }}>
            <button className={activeTaskFilter === 'dynamic' ? 'active' : ''} onClick={() => setActiveTaskFilter('dynamic')}>Dynamic</button>
            <button className={activeTaskFilter === 'all' ? 'active' : ''} onClick={() => setActiveTaskFilter('all')}>Reset Filter</button>
          </div>
          <ul className="list">
            {filteredTasks.map((t) => (
              <li key={t.id}>
                <span>{t.title}</span>
                <small>{t.type} {t.time ? `• ${t.time}` : ''}</small>
                <div className="two-col" style={{ marginTop: 6 }}>
                  <select value={t.status} onChange={(e) => updateTaskStatus(t, e.target.value)}>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="handed_over">Handed Over</option>
                  </select>
                  <button className="outline" onClick={() => removeTask(t.id)}>Delete</button>
                </div>
              </li>
            ))}
            {filteredTasks.length === 0 && <li><small>No tasks yet.</small></li>}
          </ul>
        </div>
      </section>

      <section className="panel">
        <h3>Shift Report</h3>
        <div className="two-col" style={{ marginTop: 10 }}>
          <button onClick={buildReport} disabled={busy}>{busy ? 'Generating...' : 'Generate Report'}</button>
          <button className="outline" onClick={copyReportText} disabled={!report}>Copy Text</button>
        </div>
        {report && (
          <div className="report-block">
            <p><strong>Subject:</strong> {report.subject}</p>
            <p><strong>To:</strong> {report.recipients.join(', ') || 'None'}</p>
            <p><strong>CC:</strong> {report.cc.join(', ') || 'None'}</p>
            <button className="outline" onClick={openMailDraft}>Open Mail Draft</button>
            <textarea readOnly value={report.textBody} rows={10} />
          </div>
        )}
      </section>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('itops_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('itops_user');
    return raw ? JSON.parse(raw) : null;
  });

  function handleAuthenticated(newToken, newUser) {
    localStorage.setItem('itops_token', newToken);
    localStorage.setItem('itops_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function handleLogout() {
    localStorage.removeItem('itops_token');
    localStorage.removeItem('itops_user');
    setToken('');
    setUser(null);
  }

  return token && user
    ? <Dashboard token={token} user={user} onLogout={handleLogout} />
    : <AuthPanel onAuthenticated={handleAuthenticated} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
