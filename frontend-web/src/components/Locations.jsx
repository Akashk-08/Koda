import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building, Plus, X, Globe, Users, Trash2, Pencil } from 'lucide-react';

const Locations = ({ user: propsUser }) => {
  const user = propsUser || JSON.parse(localStorage.getItem("koda_user") || "{}");

  // Strict Admin Check for Add/Edit/Delete
  const isAdmin = user?.role === 'ADMIN';

  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const API_URL = "192.168.1.92:8080";

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    teamAssignedNames: ''
  });

  const fetchLocations = async () => {
    try {
      if (!user?.organizationId) {
        setLoading(false);
        return;
      }
      const res = await fetch(`http://${API_URL}/api/locations?orgId=${user.organizationId}`);
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch (err) {
      console.error("Error fetching locations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [user?.organizationId]);

  // Open Modal for Editing
  const handleEditClick = (loc) => {
    setFormData({
      name: loc.name || '',
      address: loc.address || '',
      latitude: loc.latitude || '',
      longitude: loc.longitude || '',
      teamAssignedNames: loc.teamAssignedNames || ''
    });
    setEditId(loc.id);
    setIsModalOpen(true);
  };

  // Open Modal for Creating
  const handleCreateClick = () => {
    setFormData({ name: '', address: '', latitude: '', longitude: '', teamAssignedNames: '' });
    setEditId(null);
    setIsModalOpen(true);
  };

  // Submit Handler (Handles both Create and Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Only admins can perform this action.");
    if (!formData.name.trim()) return alert("Location name is required.");

    setIsSubmitting(true);
    try {
      const url = editId
        ? `http://${API_URL}/api/locations/${editId}`
        : `http://${API_URL}/api/locations`;

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, organizationId: user.organizationId })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchLocations();
      } else {
        alert(`Failed to ${editId ? 'update' : 'create'} location.`);
      }
    } catch (err) {
      alert("Server connection error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteLocation = async (id, name) => {
    if (!isAdmin) return alert("Only admins can delete locations.");
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`http://${API_URL}/api/locations/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchLocations();
      } else {
        alert("Failed to delete location.");
      }
    } catch (err) {
      alert("Server connection error.");
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputClasses = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm text-gray-900";
  const labelClasses = "block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5";

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans relative">

      <div className="p-8 pb-0 shrink-0">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-1">
              <MapPin className="w-4 h-4" /> Organization / Locations
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Site Locations</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Manage and view all registered facilities and sites.</p>
          </div>
          {isAdmin && (
            <button onClick={handleCreateClick} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-all">
              <Plus className="w-4 h-4" /> Add Location
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-8 pb-8 flex flex-col">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">

          <div className="p-4 border-b border-gray-100 flex justify-start bg-white shrink-0">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Location Name</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Assigned Teams</th>
                  {isAdmin && <th className="px-6 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={isAdmin ? 4 : 3} className="text-center py-16 text-gray-500 font-medium">Loading locations...</td></tr>
                ) : filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="text-center py-20">
                      <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                        <MapPin className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No locations found.</p>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="mt-3 text-sm text-blue-600 font-bold hover:underline">Clear search</button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100 group-hover:scale-105 transition-transform"><Building className="w-5 h-5" /></div>
                          <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{loc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{loc.address || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-bold">{loc.teamAssignedNames || loc.teams || 'Unassigned'}</td>

                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditClick(loc)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Edit Location">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteLocation(loc.id, loc.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete Location">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 sm:p-6">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" /> {editId ? 'Edit Location' : 'Add New Location'}
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">{editId ? 'Update the details for this facility.' : 'Register a new facility, site, or warehouse.'}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 sm:p-8 space-y-6 bg-gray-50/30">

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                  <div>
                    <label className={labelClasses}>Location Name <span className="text-red-500">*</span></label>
                    <input required type="text" placeholder="e.g. Dallas Central Warehouse" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Physical Address</label>
                    <input type="text" placeholder="e.g. 123 Main St, Dallas, TX 75201" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClasses}><Globe className="w-3.5 h-3.5" /> Latitude</label>
                      <input type="text" placeholder="e.g. 32.7767" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}><Globe className="w-3.5 h-3.5" /> Longitude</label>
                      <input type="text" placeholder="e.g. -96.7970" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} className={inputClasses} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className={labelClasses}><Users className="w-3.5 h-3.5" /> Assigned Teams</label>
                    <input type="text" placeholder="e.g. South Region, Maintenance Crew A" value={formData.teamAssignedNames} onChange={e => setFormData({ ...formData, teamAssignedNames: e.target.value })} className={inputClasses} />
                    <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-1">Comma-separated list of teams managing this location.</p>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 px-8 py-5 bg-white border-t border-gray-200 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : (editId ? "Save Changes" : "Save Location")}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </main>
  );
};

export default Locations;