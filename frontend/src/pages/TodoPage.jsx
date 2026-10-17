
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TodoForm from '../components/TodoForm';
import TodoCard from '../components/TodoCard';
import {
  getAllTodos,
  createTodo,
  toggleComplete,
  deleteTodo,
  summarizeTodos,
} from '../api';
import '../styles/global.css';

export default function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'there';

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    navigate('/login', { replace: true });
  }, [navigate]);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getAllTodos();
      setTodos(data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        setError(
          'Could not connect to the server. Check your internet connection or try again later.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTodos();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchTodos]);

  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowLogoutConfirm(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLogoutConfirm]);

  const handleCreate = async (title, description) => {
    const { data } = await createTodo(title, description);
    setTodos((prev) => [data, ...prev]);
  };

  const handleToggle = async (id) => {
    const { data } = await toggleComplete(id);
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? data : todo))
    );
  };

  const handleDelete = async (id) => {
    await deleteTodo(id);
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    setShowSummary(true);

    try {
      const { data } = await summarizeTodos();
      setSummary(data.summary);
    } catch {
      setSummaryError('Could not generate summary. Try again!');
    } finally {
      setSummaryLoading(false);
    }
  };

  const closeSummary = () => {
    setShowSummary(false);
    setSummary(null);
    setSummaryError(null);
  };

  const completedCount = todos.filter(
    (todo) => todo.is_completed
  ).length;

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">✓</div>

          <div className="header-text">
            <h1 className="header-title">My Todo List</h1>
            <p className="header-sub">Welcome back, {username}!</p>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            Logout
          </button>
        </div>
      </header>

      {showLogoutConfirm && (
        <div
          className="logout-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="logout-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="logout-modal-icon" aria-hidden="true">
              !
            </div>

            <h2 id="logout-title">Confirm Logout</h2>

            <p id="logout-description">
              Are you sure you want to log out of your account?
            </p>

            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
                autoFocus
              >
                Cancel
              </button>

              <button
                type="button"
                className="logout-confirm-btn"
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main">
        <TodoForm onSubmit={handleCreate} />

        {todos.length > 0 && !loading && (
          <div className="stats">
            <span>{todos.length} total</span>
            <span className="stats-dot">·</span>
            <span className="stats-done">
              {completedCount} completed
            </span>
            <span className="stats-dot">·</span>
            <span className="stats-todo">
              {todos.length - completedCount} pending
            </span>
          </div>
        )}

        <div className="summarize-wrap">
          <button
            type="button"
            className="btn btn-ai"
            onClick={handleSummarize}
            disabled={summaryLoading || todos.length === 0}
          >
            {summaryLoading ? (
              <>
                <span className="spinner-inline" />
                AI is analyzing your todos…
              </>
            ) : (
              '✨ Summarize My Todos'
            )}
          </button>
        </div>

        {showSummary && (
          <div className="ai-summary-card">
            <div className="ai-summary-header">
              <span className="ai-summary-title">
                ✨ AI Summary
              </span>

              <button
                type="button"
                className="ai-summary-close"
                onClick={closeSummary}
                aria-label="Close summary"
              >
                ✕
              </button>
            </div>

            {summaryLoading ? (
              <p className="ai-summary-text">
                AI is analyzing your todos…
              </p>
            ) : summaryError ? (
              <p className="ai-summary-error">{summaryError}</p>
            ) : (
              <p className="ai-summary-text">{summary}</p>
            )}
          </div>
        )}

        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
            <p className="spinner-label">Loading your todos…</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-banner">
            <span>⚠ {error}</span>
            <button
              type="button"
              className="retry-btn"
              onClick={fetchTodos}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && todos.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">No todos yet!</p>
            <p className="empty-hint">
              Use the form above to add your first task.
            </p>
          </div>
        )}

        {!loading && !error && (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id}>
                <TodoCard
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
