import { useState } from 'react';
import { seedState } from '../data.js';
import { getPassword, isValid } from '../sync.js';
import { todayKey } from '../lib.js';

const STATUS_TEXT = {
  checking: 'Checking the sync connection.',
  synced: 'Sync is on. Changes save to the cloud and appear on your other devices.',
  saving: 'Saving your latest changes.',
  off: 'Cloud sync is off. Your data is saved in this browser only.',
  locked: 'Sync is set up but the password is missing or wrong. Enter it below.',
  error: 'Could not reach the server. Changes are saved on this device and will sync when you are back online.',
};

export default function Settings({ state, update, replaceAll, sync, savePassword }) {
  const [password, setPasswordInput] = useState(getPassword());
  const [message, setMessage] = useState('');
  const [goal, setGoal] = useState(String(state.settings?.weeklyGoalHours ?? 10));

  const saveGoal = (e) => {
    e.preventDefault();
    const hours = Math.round(Number(goal) * 2) / 2;
    if (!(hours > 0) || hours > 100) {
      setMessage('Weekly goal must be between 0.5 and 100 hours.');
      return;
    }
    update((s) => ({ ...s, settings: { ...s.settings, weeklyGoalHours: hours } }));
    setGoal(String(hours));
    setMessage('Weekly goal saved.');
  };

  const connect = async (e) => {
    e.preventDefault();
    const result = await savePassword(password);
    setMessage(
      result === 'ok'
        ? 'Connected. Your data is syncing.'
        : result === 'locked'
          ? 'That password did not match.'
          : 'Sync is not available yet. See the setup steps below.',
    );
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stack-prep-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isValid(parsed)) throw new Error('bad shape');
        if (!window.confirm('Replace everything in the tracker with this backup?')) return;
        replaceAll({ settings: { weeklyGoalHours: 10 }, ...parsed });
        setMessage('Backup restored.');
      } catch {
        setMessage('That file is not a Stack Prep backup.');
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    if (!window.confirm('Delete all your data and go back to the starter roadmap? This cannot be undone.')) return;
    replaceAll(seedState());
    setMessage('Tracker reset to the starter roadmap.');
  };

  return (
    <div className="page narrow">
      <header className="page-head">
        <h1 className="page-title">Settings</h1>
      </header>

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}

      <form className="panel form" onSubmit={saveGoal}>
        <h2>Weekly goal</h2>
        <label className="field">
          <span>Hours per week</span>
          <input type="number" min="0.5" max="100" step="0.5" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </label>
        <div className="form-actions left">
          <button type="submit" className="btn btn-primary">
            Save goal
          </button>
        </div>
      </form>

      <form className="panel form" onSubmit={connect}>
        <h2>Sync across devices</h2>
        <p className="hint">{STATUS_TEXT[sync.status]}</p>
        {sync.status === 'off' && sync.reason && <p className="hint">{sync.reason}</p>}
        <label className="field">
          <span>Sync password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="The value of APP_PASSWORD"
          />
        </label>
        <div className="form-actions left">
          <button type="submit" className="btn btn-primary">
            Save and connect
          </button>
        </div>
        <details className="setup">
          <summary>How to turn sync on</summary>
          <ol>
            <li>In Vercel, open your project, then Storage, and add an Upstash Redis database.</li>
            <li>Under Settings, then Environment Variables, add APP_PASSWORD with a password you choose.</li>
            <li>Redeploy the project, then enter the same password here.</li>
          </ol>
        </details>
      </form>

      <section className="panel">
        <h2>Your data</h2>
        <p className="hint">Download a backup, restore one, or start over.</p>
        <div className="form-actions left">
          <button type="button" className="btn btn-ghost" onClick={exportData}>
            Download backup
          </button>
          <label className="btn btn-ghost file-btn">
            Restore backup
            <input type="file" accept="application/json,.json" onChange={importData} />
          </label>
          <button type="button" className="btn btn-danger" onClick={reset}>
            Reset everything
          </button>
        </div>
      </section>
    </div>
  );
}
