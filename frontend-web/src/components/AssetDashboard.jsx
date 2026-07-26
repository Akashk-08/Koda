import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';

const AssetDashboard = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      // Ensure this matches your backend URL
      const response = await fetch('http://localhost:8080/api/assets');
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setAssets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPERATIONAL': return <CheckCircle className="text-green-500 w-5 h-5" />;
      case 'MAINTENANCE': return <RefreshCw className="text-yellow-500 w-5 h-5" />;
      case 'DOWN': return <AlertTriangle className="text-red-500 w-5 h-5" />;
      default: return <Package className="text-gray-500 w-5 h-5" />;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Asset Overview</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{asset.name}</h3>
              {getStatusIcon(asset.status)}
            </div>
            <p className="text-sm text-gray-500 mb-2">Category: {asset.category || 'N/A'}</p>
            <p className="text-sm text-gray-500">Location: {asset.location || 'N/A'}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button className="text-blue-600 text-sm font-medium hover:underline">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {assets.length === 0 && !error && (
        <div className="text-center py-20 text-gray-400">No assets found. Start by adding one!</div>
      )}
    </div>
  );
};

export default AssetDashboard;