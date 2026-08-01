import React, { useState, useEffect } from 'react';
import { Check, X, Users, MapPin, Briefcase } from 'lucide-react';

const Requests = ({ user }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/accessrequests?orgId=${user.organizationId}&requesterId=${user.id}`);
      if (res.ok) setPendingUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organizationId) fetchRequests();
  }, [user]);

  const handleApproval = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }) // 'APPROVED' or 'REJECTED'
      });
      if (res.ok) {
        // Remove the user from the pending list instantly
        setPendingUsers(pendingUsers.filter(u => u.id !== id));
      }
    } catch (err) {
      alert("Failed to process request.");
    }
  };

  return (
    <main className="flex-1 overflow-auto p-8 bg-gray-50">
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span>Organization</span> <span className="mx-2">/</span> <span>Access Requests</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" /> Pending Access Requests
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve workspace access for new team members.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role / Site</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applied</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading requests...</td></tr>
            ) : pendingUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">No pending requests at this time.</td></tr>
            ) : (
              pendingUsers.map((applicant) => (
                <tr key={applicant.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-3 overflow-hidden shadow-sm border border-blue-200">
                        {applicant.profilePicUrl ? <img src={applicant.profilePicUrl} alt="" className="w-full h-full object-cover" /> : applicant.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{applicant.firstName} {applicant.lastName}</div>
                        <div className="text-xs text-gray-500">{applicant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 flex items-center gap-1 mb-1"><Briefcase className="w-3 h-3 text-gray-400" /> {applicant.designation || 'Not specified'}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {applicant.siteLocation || 'Not specified'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{applicant.phoneNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(applicant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleApproval(applicant.id, 'APPROVED')}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-colors shadow-sm"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleApproval(applicant.id, 'REJECTED')}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                      title="Deny"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Requests;