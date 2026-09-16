/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  BarChart3,
  AlertTriangle,
  Clock,
  Layers,
  Cpu,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  PieChart,
  MapPin,
  Activity,
} from "lucide-react";

const Analytics = ({ user }: any) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // STRICT PERMISSION GATE: Only Shop or Warehouse users see the Activity Stream
  const isShopOrWarehouse = 
    user?.siteLocation?.toLowerCase().includes("shop") ||
    user?.siteLocation?.toLowerCase().includes("warehouse");

  const fetchMetrics = async () => {
    if (!user?.organizationId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analytics?orgId=${user.organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else {
        setError("Failed to load metrics data.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error while connecting to analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user?.organizationId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500">Loading operational analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-2" />
        <p className="text-base font-bold text-gray-900">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalWO = metrics?.workOrders?.total || 1;
  const openWO = metrics?.workOrders?.open || 0;
  const doneWO = metrics?.workOrders?.completed || 0;
  const openPercentage = Math.round((openWO / totalWO) * 100);
  const donePercentage = Math.round((doneWO / totalWO) * 100);

  const totalAssets = metrics?.assets?.total || 1;
  const operationalAssets = metrics?.assets?.operational || 0;
  const damagedAssets = metrics?.assets?.damaged || 0;
  const operationalPercentage = Math.round((operationalAssets / totalAssets) * 100);

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 p-4 md:p-8 overflow-y-auto font-sans pb-24">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" /> Operational Command Center
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Real-time multi-site agility, asset uptime tracking, and priority triage.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="bg-white border border-gray-200 hover:bg-gray-100 p-2.5 rounded-xl text-gray-600 flex items-center gap-2 text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Work Orders Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">
              Work Orders
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900">{metrics?.workOrders?.total || 0}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-500">
              <span className="text-blue-600">Open: {openWO}</span>
              <span>•</span>
              <span className="text-green-600">Done: {doneWO}</span>
            </div>
          </div>
        </div>

        {/* Asset Uptime Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">
              Asset Uptime
            </span>
            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900">
              {metrics?.assets?.uptimePercentage || "100"}%
            </h3>
            <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-500">
              <span className="text-green-600">Active: {operationalAssets}</span>
              <span>•</span>
              <span className="text-red-600">Issues: {damagedAssets}</span>
            </div>
          </div>
        </div>

        {/* Total Assets Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">
              Registered Assets
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900">{metrics?.assets?.total || 0}</h3>
            <p className="text-xs font-bold text-gray-500 mt-2">Monitored equipment units</p>
          </div>
        </div>

        {/* Low Stock Parts Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">
              Parts Inventory
            </span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900">
              {metrics?.inventory?.totalParts || 0}
            </h3>
            <p className="text-xs font-bold text-orange-600 mt-2">
              {metrics?.inventory?.lowStockParts || 0} items low on stock
            </p>
          </div>
        </div>
      </div>

      {/* VISUAL ANALYTICS SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Work Order Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" /> Work Order Status Distribution
            </h3>
            <span className="text-xs font-bold text-gray-400">Total: {totalWO}</span>
          </div>

          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex mb-6">
            <div style={{ width: `${openPercentage}%` }} className="bg-blue-500 h-full"></div>
            <div style={{ width: `${donePercentage}%` }} className="bg-green-500 h-full"></div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Open / Pending
              </span>
              <span className="text-gray-900">{openWO} ({openPercentage}%)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Completed / Closed
              </span>
              <span className="text-gray-900">{doneWO} ({donePercentage}%)</span>
            </div>
          </div>
        </div>

        {/* Asset Operational Health */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Asset Health & Readiness
            </h3>
            <span className="text-xs font-bold text-gray-400">Uptime: {metrics?.assets?.uptimePercentage || "100"}%</span>
          </div>

          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex mb-6">
            <div style={{ width: `${operationalPercentage}%` }} className="bg-green-500 h-full"></div>
            <div style={{ width: `${100 - operationalPercentage}%` }} className="bg-red-500 h-full"></div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Operational Units
              </span>
              <span className="text-gray-900">{operationalAssets} ({operationalPercentage}%)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Maintenance / Issues
              </span>
              <span className="text-gray-900">{damagedAssets} ({100 - operationalPercentage}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW: Priority Triage & Multi-Site Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Priority Triage */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Work Order Priority Triage
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-red-600">Critical</p>
                <h4 className="text-2xl font-black text-red-900 mt-1">{metrics?.workOrders?.critical || 0}</h4>
              </div>
              <ShieldAlert className="w-7 h-7 text-red-500 opacity-80" />
            </div>
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-orange-600">High</p>
                <h4 className="text-2xl font-black text-orange-900 mt-1">{metrics?.workOrders?.high || 0}</h4>
              </div>
              <AlertTriangle className="w-7 h-7 text-orange-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Multi-Site Location Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-purple-600" /> Multi-Site Facility Workload
          </h3>
          <div className="space-y-3 max-h-36 overflow-y-auto">
            {metrics?.locationBreakdown?.length > 0 ? (
              metrics.locationBreakdown.map((loc: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs font-bold bg-gray-50 p-2.5 rounded-xl">
                  <span className="text-gray-700">{loc.name}</span>
                  <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg">{loc.count} tickets</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No facility locations registered.</p>
            )}
          </div>
        </div>
      </div>

      {/* THIRD ROW: Live Activity Stream - RESTRICTED VISIBILITY */}
      {isShopOrWarehouse && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-600" /> Live Operational Activity Stream
          </h3>
          <div className="space-y-3">
            {metrics?.recentActivity?.length > 0 ? (
              metrics.recentActivity.map((log: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                  <span className="font-medium text-gray-800">
                    <span className="text-blue-600 font-bold">{log.actor?.firstName || log.actor?.email || "System"}</span> {log.action}
                    {log.entityTitle && <span className="text-gray-400 font-bold ml-1">({log.entityTitle})</span>}
                  </span>
                  <span className="text-gray-400 font-bold">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">Recent operational activity logs will appear here.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Analytics;