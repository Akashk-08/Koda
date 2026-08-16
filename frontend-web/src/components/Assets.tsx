/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
// frontend-web/src/components/Assets.tsx
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Box,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Pencil,
  ArrowLeft,
  Activity,
  Layers,
  Wrench,
  QrCode,
} from "lucide-react";
import CreateAssetModal from "./CreateAssetModal";
import AssetQRCode from "./AssetQRCode.jsx";

const CATEGORIES = [
  "ANNUAL_PREVENTIVE_MAINTENANCE",
  "ASSETS",
  "LARGE_DAMAGE",
  "PARTS_REQUEST",
  "PROJECT_UPGRADE",
  "SIX_MONTH_PREVENTIVE_MAINTENANCE",
  "SUPPORT_REQUEST",
  "WEEKLY_MONTHLY_CHECKLISTS",
];

const Assets = ({ user }: any) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "OPERATIONAL" | "DAMAGED"
  >("ALL");

  // UI States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [assetTab, setAssetTab] = useState<
    | "DETAILS"
    | "SUBASSETS"
    | "RELIABILITY"
    | "WORKORDERS"
    | "PARTS"
    | "ACTIVITY"
  >("DETAILS");

  // QR Modal State
  const [selectedQrAsset, setSelectedQrAsset] = useState<any | null>(null);

  // Edit State inside Detail View
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const fetchData = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/assets?orgId=${user?.organizationId}`,
      );
      if (res.ok) setAssets(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organizationId) fetchData();
  }, [user]);

  const handleRowClick = (asset: any) => {
    setSelectedAsset(asset);
    setEditForm(asset);
    setIsEditing(false);
    setAssetTab("DETAILS");
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:8080/api/assets/${selectedAsset.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        },
      );
      if (res.ok) {
        setIsEditing(false);
        fetchData();
        const updated = await res.json();
        setSelectedAsset(updated);
      } else {
        alert("Failed to update asset.");
      }
    } catch (err) {
      alert("Server error.");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/assets/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedAsset(null);
        fetchData();
      } else {
        alert("Failed to delete asset.");
      }
    } catch (err) {
      alert("Server error.");
    }
  };

  const filteredAssets = assets.filter((asset) => {
    let matches = true;
    if (statusFilter !== "ALL")
      matches = matches && asset.status === statusFilter;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches =
        matches &&
        (asset.name?.toLowerCase().includes(query) ||
          asset.barcode?.toLowerCase().includes(query) ||
          asset.serialNumber?.toLowerCase().includes(query));
    }
    return matches;
  });

  const operationalCount = assets.filter(
    (a) => a.status === "OPERATIONAL",
  ).length;
  const damagedCount = assets.filter((a) => a.status === "DAMAGED").length;

  //  FULL SCREEN DETAIL VIEW (Like WorkOrderDetail)
  if (selectedAsset) {
    const relatedWorkOrders = selectedAsset.workOrders || [];
    return (
      <div className="flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedAsset(null)}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-gray-900 text-lg">
              Asset: {selectedAsset.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedAsset.status === "OPERATIONAL" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
            >
              {selectedAsset.status}
            </span>
            <button
              onClick={() => handleDeleteAsset(selectedAsset.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
              title="Delete Asset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Title / Edit Area */}
            <div className="px-10 pt-8 pb-6 shrink-0 relative border-b border-gray-100">
              {isEditing ? (
                <form
                  onSubmit={handleUpdateAsset}
                  className="space-y-4 max-w-4xl"
                >
                  <input
                    className="w-full text-2xl font-black text-gray-900 border border-blue-300 rounded-lg p-3 outline-none bg-gray-50 shadow-sm"
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                  <textarea
                    className="w-full text-sm text-gray-800 border border-blue-300 rounded-lg p-3 outline-none min-h-[100px] bg-gray-50 shadow-sm"
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-100 text-gray-600 px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-start max-w-4xl">
                  <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-1">
                      {selectedAsset.name}
                    </h1>
                    <p className="text-sm text-gray-500 whitespace-pre-wrap">
                      {selectedAsset.description || "No description provided."}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="px-10 border-b border-gray-200 flex gap-8 shrink-0">
              {[
                "DETAILS",
                "SUBASSETS",
                "RELIABILITY",
                "WORKORDERS",
                "PARTS",
                "ACTIVITY",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAssetTab(tab as any)}
                  className={`pb-3 text-sm font-bold tracking-wide transition-colors relative ${assetTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
                >
                  {tab === "WORKORDERS"
                    ? "Work Orders"
                    : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  {assetTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto px-10 py-8 bg-white">
              {assetTab === "DETAILS" && (
                <div className="max-w-3xl space-y-4">
                  <h3 className="text-base font-bold text-gray-900 mb-4">
                    Asset Specifications
                  </h3>
                  <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                    <div className="flex py-3.5 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        LOCATION
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedAsset.locationName || "—"}
                      </div>
                    </div>
                    <div className="flex py-3.5 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        CATEGORY
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedAsset.category?.replace(/_/g, " ") || "—"}
                      </div>
                    </div>
                    <div className="flex py-3.5 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        SERIAL NUMBER
                      </div>
                      <div className="text-sm font-mono font-medium text-gray-900">
                        {selectedAsset.serialNumber || "—"}
                      </div>
                    </div>
                    <div className="flex py-3.5 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        BARCODE
                      </div>
                      <div className="text-sm font-mono font-medium text-gray-900">
                        {selectedAsset.barcode || "—"}
                      </div>
                    </div>
                    <div className="flex py-3.5 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        MODEL
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedAsset.model || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {assetTab === "SUBASSETS" && (
                <div className="max-w-3xl text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                  <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">
                    No subassets linked to this asset.
                  </p>
                </div>
              )}

              {assetTab === "RELIABILITY" && (
                <div className="max-w-3xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-gray-900">
                      Uptime & Reliability Metrics
                    </h3>
                    {isEditing && (
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Uptime e.g. 99.8%"
                          value={editForm.uptime || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, uptime: e.target.value })
                          }
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Downtime e.g. 1.2 hrs"
                          value={editForm.downtime || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              downtime: e.target.value,
                            })
                          }
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-green-50 border border-green-100 rounded-xl">
                      <span className="text-xs font-bold text-green-700 uppercase">
                        Uptime Recorded
                      </span>
                      <h4 className="text-3xl font-black text-green-800 mt-1">
                        {selectedAsset.uptime || "100%"}
                      </h4>
                    </div>
                    <div className="p-6 bg-orange-50 border border-orange-100 rounded-xl">
                      <span className="text-xs font-bold text-orange-700 uppercase">
                        Downtime Recorded
                      </span>
                      <h4 className="text-3xl font-black text-orange-800 mt-1">
                        {selectedAsset.downtime || "0 hrs"}
                      </h4>
                    </div>
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl col-span-2">
                      <span className="text-xs font-bold text-blue-700 uppercase">
                        Reliability Score
                      </span>
                      <h4 className="text-3xl font-black text-blue-800 mt-1">
                        {selectedAsset.reliabilityScore || "A+"}
                      </h4>
                    </div>
                  </div>
                </div>
              )}
              {assetTab === "WORKORDERS" && (
                <div className="max-w-3xl space-y-4">
                  <h3 className="text-base font-bold text-gray-900">
                    Related Work Orders
                  </h3>
                  {relatedWorkOrders.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                      <Wrench className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-500">
                        No work orders linked to this asset.
                      </p>
                    </div>
                  ) : (
                    relatedWorkOrders.map((wo: any) => (
                      <div
                        key={wo.id}
                        className="p-4 border border-gray-200 rounded-xl flex justify-between items-center"
                      >
                        <span className="font-bold text-sm text-gray-900">
                          WO-{wo.id}: {wo.title}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                          {wo.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {assetTab === "PARTS" && (
                <div className="max-w-3xl text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                  <Box className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">
                    No inventory parts assigned to this asset.
                  </p>
                </div>
              )}

              {assetTab === "ACTIVITY" && (
                <div className="max-w-3xl space-y-4">
                  <h3 className="text-base font-bold text-gray-900">
                    Asset History & Activity
                  </h3>
                  <div className="p-4 border border-gray-200 rounded-xl flex items-center gap-3 bg-gray-50/50">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Asset registered in system
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(selectedAsset.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
      <div className="p-8 pb-0 shrink-0">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Assets
            </h1>

            <div className="flex gap-6 mt-4 text-sm font-bold border-b border-gray-200">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`pb-3 relative transition-colors ${statusFilter === "ALL" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                Total assets{" "}
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] ${statusFilter === "ALL" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {assets.length}
                </span>
                {statusFilter === "ALL" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                )}
              </button>

              <button
                onClick={() => setStatusFilter("OPERATIONAL")}
                className={`pb-3 relative transition-colors ${statusFilter === "OPERATIONAL" ? "text-green-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                Operational{" "}
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] ${statusFilter === "OPERATIONAL" ? "bg-green-100 text-green-700" : "bg-green-50 text-green-600"}`}
                >
                  {operationalCount}
                </span>
                {statusFilter === "OPERATIONAL" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full"></div>
                )}
              </button>

              <button
                onClick={() => setStatusFilter("DAMAGED")}
                className={`pb-3 relative transition-colors ${statusFilter === "DAMAGED" ? "text-red-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                Not Operational{" "}
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] ${statusFilter === "DAMAGED" ? "bg-red-100 text-red-700" : "bg-red-50 text-red-600"}`}
                >
                  {damagedCount}
                </span>
                {statusFilter === "DAMAGED" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-t-full"></div>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 mb-2"
          >
            <Plus className="w-4 h-4" /> Create Asset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-8 pb-8 flex flex-col">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* SEARCH BOX ON THE LEFT */}
          <div className="p-4 border-b border-gray-100 flex justify-start bg-white shrink-0">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, barcode, serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-gray-50/30">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Asset Name
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-16 text-gray-500 font-medium"
                    >
                      Loading assets...
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20">
                      <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                        <Box className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        No assets found matching your criteria.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                        }}
                        className="mt-3 text-sm text-blue-600 font-bold hover:underline"
                      >
                        Clear search
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => handleRowClick(asset)}
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100 group-hover:scale-105 transition-transform">
                            <Box className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[220px]">
                              {asset.name}
                            </span>
                            <span className="text-xs text-gray-400 font-medium truncate max-w-[220px]">
                              {asset.category?.replace(/_/g, " ") ||
                                "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-semibold">
                        {asset.locationName || "—"}
                      </td>

                      {/* UPDATED BARCODE COLUMN WITH QR ICON */}
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono bg-gray-50/50">
                        <div className="flex items-center gap-3">
                          <span>{asset.barcode || "—"}</span>
                          {(asset.barcode || asset.serialNumber) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQrAsset(asset);
                              }}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="View QR Code"
                            >
                              <QrCode className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500 font-mono bg-gray-50/50">
                        {asset.serialNumber || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {asset.status === "OPERATIONAL" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm">
                            <AlertCircle className="w-3.5 h-3.5" /> Damaged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
        onCreated={fetchData}
      />

      {/* QR CODE MODAL OVERLAY */}
      {selectedQrAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl relative w-full max-w-sm flex flex-col items-center p-8 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedQrAsset(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Asset Tag</h2>
            <p className="text-sm text-gray-500 mb-6 text-center line-clamp-1">
              {selectedQrAsset.name}
            </p>

            <AssetQRCode
              assetName={selectedQrAsset.name}
              barcodeValue={
                selectedQrAsset.barcode || selectedQrAsset.serialNumber
              }
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default Assets;
