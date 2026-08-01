import React, { useState, useEffect } from 'react';
import { MapPin, Search, Building2, Users } from 'lucide-react';

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/locations');
        if (response.ok) {
          const data = await response.json();
          setLocations(data);
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const filteredLocations = locations.filter(loc =>
    loc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8 h-full font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-sm font-semibold text-blue-600 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Organization / Locations
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Site Locations</h1>
            <p className="text-gray-500 mt-1">Manage and view all registered facilities and sites.</p>
          </div>

          <div className="relative w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-5 font-semibold">Location Name</th>
                  <th className="p-5 font-semibold">Address</th>
                  <th className="p-5 font-semibold">Coordinates</th>
                  <th className="p-5 font-semibold">Assigned Teams</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500 font-medium">Loading locations...</td>
                  </tr>
                ) : filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500 font-medium">No locations found.</td>
                  </tr>
                ) : (
                  filteredLocations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{loc.name}</div>
                            {loc.parentLocationName && <div className="text-xs text-gray-500 mt-0.5">Parent: {loc.parentLocationName}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-600 font-medium max-w-xs truncate">
                        {loc.address || '—'}
                      </td>
                      <td className="p-5 text-sm text-gray-500 font-mono text-xs">
                        {loc.latitude && loc.longitude ? `${loc.latitude}, ${loc.longitude}` : '—'}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                          <Users className="w-4 h-4 text-gray-400" />
                          {loc.teamAssignedNames || 'Unassigned'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;