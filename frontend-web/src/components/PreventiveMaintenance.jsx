import React, { useState, useEffect } from 'react';
import { Plus, Clock, Calendar, ShieldCheck } from 'lucide-react';

const PreventiveMaintenance = ({ user }) => {
  const [pms, setPms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orgUsers, setOrgUsers] = useState([]);

  const fetchPMs = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/pm?orgId=${user.organizationId}&userId=${user.id}`);
      if (res.ok) setPms(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPMs();
    if (user?.organizationId) {
      fetch(`http://localhost:8080/api/users/${user.organizationId}`)
        .then(res => res.json())
        .then(data => setOrgUsers(data));
    }
  }, [user]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span>Workspace</span> <span className="mx-2">/</span> <span>Preventive Maintenance</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PM Schedules</h1>
          <p className="text-sm text-gray-500 mt-1">Automated recurring work orders based on set schedules.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create PM Schedule
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Next Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assignee</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pms.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">No schedules created yet.</td></tr>
            ) : pms.map(pm => (
              <tr key={pm.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{pm.title}</div>
                  <div className="text-xs text-gray-500 truncate max-w-xs">{pm.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                    <Clock className="w-3 h-3" /> {pm.scheduleType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {new Date(pm.nextDueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {pm.assignee ? `${pm.assignee.firstName} ${pm.assignee.lastName}` : 'Unassigned'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CreatePMModal
          user={user}
          orgUsers={orgUsers}
          onClose={() => setIsModalOpen(false)}
          onCreated={() => { setIsModalOpen(false); fetchPMs(); }}
        />
      )}
    </div>
  );
};

const CreatePMModal = ({ user, orgUsers, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', scheduleType: 'MONTHLY', firstDueDate: '', assigneeId: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstDueDate) return alert("First due date is required");

    await fetch('http://localhost:8080/api/pm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, organizationId: user.organizationId, creatorId: user.id })
    });
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600" /> New PM Schedule</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
            <input required type="text" className="w-full border border-gray-300 rounded p-2 text-sm" onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Weekly Headset Calibration" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea className="w-full border border-gray-300 rounded p-2 text-sm" onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Check lenses, battery, etc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
              <select className="w-full border border-gray-300 rounded p-2 text-sm" value={formData.scheduleType} onChange={e => setFormData({ ...formData, scheduleType: e.target.value })}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">First Due Date</label>
              <input required type="date" className="w-full border border-gray-300 rounded p-2 text-sm" onChange={e => setFormData({ ...formData, firstDueDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Default Assignee</label>
            <select className="w-full border border-gray-300 rounded p-2 text-sm" onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {orgUsers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 font-medium">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded font-medium">Start Schedule</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreventiveMaintenance;