import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage('Reset link is missing or invalid.');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      await resetPassword(token, password);
      setMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(String(err?.response?.data?.detail ?? 'Could not update password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <form onSubmit={handleSubmit} className="card w-full space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Set a New Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Use the temporary passcode from your email to complete the reset.
          </p>
        </div>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-field"
          required
        />
        {message && <p className="text-sm text-slate-600">{message}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Saving...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
