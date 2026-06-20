import { useEffect, useMemo, useState } from 'react';
import {
  assignTeamMembers,
  downloadUsersCsv,
  getUsers,
  registerUser,
} from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import {
  emailDomainHint,
  emailValidationError,
} from '../../lib/email';

const ROLE_LABELS = {
  employee: 'Employee',
  team_leader: 'Team Leader',
  manager: 'Manager',
  admin: 'Office Manager',
};

const TEAM_NAMES = ['Product', 'Operations', 'Platform', 'Engineering', 'Design'];

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    job_title: '',
    role: 'employee',
    team_name: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [teamAssignments, setTeamAssignments] = useState({});
  const [leaderTeamNames, setLeaderTeamNames] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => getUsers().then((data) => {
    setUsers(data);
    const assignments = {};
    const teamNames = {};
    data.forEach((user) => {
      if (user.role === 'team_leader') {
        teamNames[user.id] = user.team_name ?? '';
        assignments[user.id] = data
          .filter((candidate) => candidate.team_leader_id === user.id)
          .map((candidate) => candidate.id);
      }
    });
    setTeamAssignments(assignments);
    setLeaderTeamNames(teamNames);
  });

  useEffect(() => {
    load();
  }, []);

  const employees = useMemo(
    () => users.filter((user) => user.role === 'employee'),
    [users],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailError = emailValidationError(form.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    try {
      const created = await registerUser({
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name,
        role: form.role,
        job_title: form.job_title || undefined,
        team_name: form.role === 'team_leader' ? form.team_name || undefined : undefined,
      });
      setForm({
        email: '',
        full_name: '',
        job_title: '',
        role: 'employee',
        team_name: '',
      });
      setShowForm(false);
      setSuccess(
        created.temporary_password
          ? `User created. Temporary password: ${created.temporary_password} (share this with the user if email is not configured).`
          : 'User created successfully.',
      );
      load();
    } catch (err) {
      setError(String(err?.response?.data?.detail ?? 'Could not create user.'));
    }
  };

  const handleSyncTeam = async (leaderId) => {
    setError('');
    setSuccess('');
    try {
      await assignTeamMembers(
        leaderId,
        teamAssignments[leaderId] ?? [],
        leaderTeamNames[leaderId] || undefined,
      );
      setSuccess('Team updated successfully.');
      load();
    } catch (err) {
      setError(String(err?.response?.data?.detail ?? 'Could not update team.'));
    }
  };

  const updateTeamSelection = (leaderId, teammateId, checked) => {
    setTeamAssignments((prev) => {
      const current = prev[leaderId] ?? [];
      const next = checked
        ? Array.from(new Set([...current, teammateId]))
        : current.filter((id) => id !== teammateId);
      return { ...prev, [leaderId]: next };
    });
  };

  const roleBadge = (role) => {
    if (role === 'admin') return 'badge-blue';
    if (role === 'manager') return 'badge-amber';
    if (role === 'team_leader') return 'badge-green';
    return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage employees, team leaders, managers, and office managers"
        action={(
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                const blob = await downloadUsersCsv();
                saveBlob(blob, 'deskdibs-users.csv');
              }}
              className="btn-secondary"
            >
              Export CSV
            </button>
            <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary">
              Add user
            </button>
          </div>
        )}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 grid gap-4 p-6 sm:grid-cols-2">
          <input
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="input-field"
            required
          />
          <input
            type="email"
            placeholder={`Email (name.surname${emailDomainHint()})`}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
            required
          />
          <input
            placeholder="Job title"
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            className="input-field"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="input-field"
          >
            <option value="employee">Employee</option>
            <option value="team_leader">Team Leader</option>
            <option value="manager">Manager</option>
            <option value="admin">Office Manager</option>
          </select>
          {form.role === 'team_leader' && (
            <select
              value={form.team_name}
              onChange={(e) => setForm({ ...form, team_name: e.target.value })}
              className="input-field sm:col-span-2"
            >
              <option value="">Select team name</option>
              {TEAM_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500 sm:col-span-2">
            Only company emails ending with {emailDomainHint()} are allowed.
            Duplicate emails are blocked automatically.
          </div>
          <button type="submit" className="btn-primary sm:col-span-2">
            Create user
          </button>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Team</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3.5 font-medium">{u.full_name}</td>
                <td className="px-4 py-3.5 text-slate-600">{u.job_title ?? '—'}</td>
                <td className="px-4 py-3.5 text-slate-600">{u.email}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(u.role)}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {u.role === 'team_leader' ? (
                    <div className="space-y-2">
                      <select
                        value={leaderTeamNames[u.id] ?? ''}
                        onChange={(e) =>
                          setLeaderTeamNames((prev) => ({ ...prev, [u.id]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                      >
                        <option value="">Team name</option>
                        {TEAM_NAMES.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <div className="max-h-28 overflow-auto rounded-lg border border-slate-200 bg-white p-2 text-xs">
                        {employees.map((candidate) => (
                          <label
                            key={candidate.id}
                            className="flex items-center gap-2 py-1 text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={(teamAssignments[u.id] ?? []).includes(candidate.id)}
                              onChange={(e) =>
                                updateTeamSelection(u.id, candidate.id, e.target.checked)
                              }
                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                            />
                            <span>{candidate.full_name}</span>
                            {candidate.team_leader_id && candidate.team_leader_id !== u.id && (
                              <span className="text-amber-600">(other team)</span>
                            )}
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSyncTeam(u.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Save team
                      </button>
                    </div>
                  ) : u.team_leader_id ? (
                    <span className="text-slate-600">
                      {u.team_name ?? 'Assigned team'}
                    </span>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
