/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  ExternalLink,
  MapPin,
} from "lucide-react";
import CreateAssetModal from "./CreateAssetModal";
import AssetQRCode from "./AssetQRCode.jsx";
import CreateWorkOrderModal from "./CreateWorkOrderModal";

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
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [orgParts, setOrgParts] = useState<any[]>([]); // Holds inventory catalog
  const [orgLocations, setOrgLocations] = useState<any[]>([]); // Holds location list
  const [loading, setLoading] = useState(true);
  const API_URL = "192.168.1.92:8080";

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "OPERATIONAL" | "DAMAGED"
  >("ALL");

  // UI States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateWOModalOpen, setIsCreateWOModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  // Quick View Modal state for Work Orders
  const [previewWO, setPreviewWO] = useState<any | null>(null);
  const [isCompletingWO, setIsCompletingWO] = useState(false);

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

  // Subasset & Parts Search States
  const [subassetSearch, setSubassetSearch] = useState("");
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const [partSearch, setPartSearch] = useState("");
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);

  const fetchData = async () => {
    try {
      // NEW: Fetching Assets, Inventory Parts, and Locations simultaneously
      const [assetsRes, partsRes, locRes] = await Promise.all([
        fetch(`http://${API_URL}/api/assets?orgId=${user?.organizationId}`),
        fetch(`http://${API_URL}/api/inventory?orgId=${user?.organizationId}`),
        fetch(`http://${API_URL}/api/locations?orgId=${user?.organizationId}`),
      ]);

      if (assetsRes.ok) {
        const freshAssets = await assetsRes.json();
        setAssets(freshAssets);
        if (selectedAsset) {
          const updatedSelected = freshAssets.find(
            (a: any) => a.id === selectedAsset.id,
          );
          if (updatedSelected) setSelectedAsset(updatedSelected);
        }
      }

      if (partsRes.ok) setOrgParts(await partsRes.json());
      if (locRes.ok) setOrgLocations(await locRes.json());
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
    // Initialize edit form arrays safely so they don't crash when searching
    setEditForm({
      ...asset,
      subassets: asset.subassets || [],
      parts: asset.parts || [],
    });
    setIsEditing(false);
    setAssetTab("DETAILS");
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Strip out deep relations and read-only fields
      const {
        id,
        workOrders,
        organization,
        createdAt,
        updatedAt,
        parentAsset, // Strip this too just in case!
        ...safePayload
      } = editForm;

      // 2. Wrap relation arrays in Prisma's required { set: [] } syntax
      safePayload.subassets = {
        set: editForm.subassets?.map((s: any) => ({ id: s.id })) || [],
      };

      safePayload.parts = {
        set: editForm.parts?.map((p: any) => ({ id: p.id })) || [],
      };

      // 3. Send the cleaned, Prisma-ready payload
      const res = await fetch(
        `http://${API_URL}/api/assets/${selectedAsset.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(safePayload),
        },
      );

      if (res.ok) {
        setIsEditing(false);
        fetchData();
      } else {
        // Capture the exact backend error message for easier debugging
        const errBody = await res.json().catch(() => ({}));
        console.error("Backend DB Error:", errBody);
        alert(
          `Failed to update asset. Check the console for exact Prisma error.`,
        );
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await fetch(`http://${API_URL}/api/assets/${id}`, {
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

  const handleQuickCompleteWO = async () => {
    if (!previewWO) return;
    setIsCompletingWO(true);
    try {
      const payload = { ...previewWO, status: "COMPLETE" };
      const res = await fetch(
        `http://${API_URL}/api/workorders/${previewWO.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        const updatedWO = await res.json();
        setPreviewWO(updatedWO);
        fetchData();
      } else {
        alert("Failed to update work order status.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while completing work order.");
    } finally {
      setIsCompletingWO(false);
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

  //  FULL SCREEN DETAIL VIEW
  if (selectedAsset) {
    const relatedWorkOrders = selectedAsset.workOrders || [];

    const generateActivityLog = (asset: any) => {
      const logs: any[] = [];
      if (asset.createdAt) {
        logs.push({
          id: "create",
          icon: <Activity className="w-4 h-4 text-blue-600" />,
          title: "Asset registered in system",
          date: new Date(asset.createdAt).getTime(),
          bgColor: "bg-blue-50/50 border-blue-100",
          iconBg: "bg-blue-100 border-blue-200",
        });
      }
      if (
        asset.updatedAt &&
        new Date(asset.updatedAt).getTime() >
          new Date(asset.createdAt).getTime() + 5000
      ) {
        logs.push({
          id: "update",
          icon: <Pencil className="w-4 h-4 text-gray-600" />,
          title: "Asset details updated",
          date: new Date(asset.updatedAt).getTime(),
          bgColor: "bg-gray-50 border-gray-200",
          iconBg: "bg-gray-200 border-gray-300",
        });
      }
      relatedWorkOrders.forEach((wo: any) => {
        if (wo.createdAt) {
          const isMovement = wo.title?.includes("[Inventory Check-");
          logs.push({
            id: `wo-${wo.id}-create`,
            icon: isMovement ? (
              <MapPin className="w-4 h-4 text-purple-600" />
            ) : (
              <Wrench className="w-4 h-4 text-orange-600" />
            ),
            title: isMovement
              ? "Asset Location Moved"
              : `Work Order Opened: WO-${wo.id}`,
            subtitle: wo.title,
            date: new Date(wo.createdAt).getTime(),
            bgColor: isMovement
              ? "bg-purple-50/50 border-purple-100"
              : "bg-orange-50/50 border-orange-100",
            iconBg: isMovement
              ? "bg-purple-100 border-purple-200"
              : "bg-orange-100 border-orange-200",
          });
        }
        if (wo.status === "COMPLETE") {
          logs.push({
            id: `wo-${wo.id}-complete`,
            icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
            title: `Work Order Completed: WO-${wo.id}`,
            subtitle: wo.title,
            date: new Date(wo.updatedAt || wo.createdAt).getTime() + 1000,
            bgColor: "bg-green-50/50 border-green-100",
            iconBg: "bg-green-100 border-green-200",
          });
        }
      });
      return logs.sort((a, b) => b.date - a.date);
    };

    return (
      <div className="flex flex-col h-full bg-gray-50 font-sans overflow-hidden relative">
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
                    className="w-full text-2xl font-black text-gray-900 border border-blue-300 rounded-lg p-3 outline-none bg-blue-50/30 shadow-sm focus:ring-2 focus:ring-blue-600 transition-all"
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                  <textarea
                    className="w-full text-sm text-gray-800 border border-blue-300 rounded-lg p-3 outline-none min-h-[100px] bg-blue-50/30 shadow-sm focus:ring-2 focus:ring-blue-600 transition-all"
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                      Save All Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({ ...selectedAsset }); // Reset changes if cancelled
                      }}
                      className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
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
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Edit Asset
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
              {/*  UPDATED: DETAILS TAB (WITH EDIT MODE)  */}
              {assetTab === "DETAILS" && (
                <div className="max-w-3xl space-y-4">
                  <h3 className="text-base font-bold text-gray-900 mb-4">
                    Asset Specifications
                  </h3>
                  <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                    <div className="flex items-center py-3 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        LOCATION
                      </div>
                      <div className="flex-1 text-sm font-medium text-gray-900">
                        {isEditing ? (
                          <select
                            value={editForm.locationName || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                locationName: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                          >
                            <option value="">Select location...</option>
                            {orgLocations.map((loc: any) => (
                              <option key={loc.id} value={loc.name}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          selectedAsset.locationName || "—"
                        )}
                      </div>
                    </div>

                    <div className="flex items-center py-3 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        CATEGORY
                      </div>
                      <div className="flex-1 text-sm font-medium text-gray-900">
                        {isEditing ? (
                          <select
                            value={editForm.category || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                category: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                          >
                            <option value="">Select category...</option>
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        ) : (
                          selectedAsset.category?.replace(/_/g, " ") || "—"
                        )}
                      </div>
                    </div>

                    <div className="flex items-center py-3 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        SERIAL NUMBER
                      </div>
                      <div className="flex-1 text-sm font-mono font-medium text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.serialNumber || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                serialNumber: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                          />
                        ) : (
                          selectedAsset.serialNumber || "—"
                        )}
                      </div>
                    </div>

                    <div className="flex items-center py-3 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        BARCODE
                      </div>
                      <div className="flex-1 text-sm font-mono font-medium text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.barcode || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                barcode: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                          />
                        ) : (
                          selectedAsset.barcode || "—"
                        )}
                      </div>
                    </div>

                    <div className="flex items-center py-3 px-6 bg-gray-50/30">
                      <div className="w-48 text-xs font-bold text-gray-500">
                        MODEL
                      </div>
                      <div className="flex-1 text-sm font-medium text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.model || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                model: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        ) : (
                          selectedAsset.model || "—"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/*  UPDATED: SUBASSETS TAB (WITH SEARCH AND LINKING)  */}
              {assetTab === "SUBASSETS" && (
                <div className="max-w-3xl space-y-4">
                  {isEditing && (
                    <div className="relative mb-8 bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                      <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
                        Search & Add Subasset
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-blue-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          value={subassetSearch}
                          onChange={(e) => {
                            setSubassetSearch(e.target.value);
                            setIsSubDropdownOpen(true);
                          }}
                          onFocus={() => setIsSubDropdownOpen(true)}
                          onBlur={() =>
                            setTimeout(() => setIsSubDropdownOpen(false), 200)
                          }
                          placeholder="Search assets by name or barcode..."
                          className="w-full pl-10 pr-4 py-2.5 border border-blue-200 shadow-sm rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        />
                        {isSubDropdownOpen && subassetSearch && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl z-20 max-h-48 overflow-y-auto">
                            {assets
                              .filter(
                                (a) =>
                                  a.id !== selectedAsset.id &&
                                  (a.name
                                    ?.toLowerCase()
                                    .includes(subassetSearch.toLowerCase()) ||
                                    a.barcode
                                      ?.toLowerCase()
                                      .includes(subassetSearch.toLowerCase())),
                              )
                              .map((a) => (
                                <button
                                  type="button"
                                  key={a.id}
                                  onClick={() => {
                                    if (
                                      !editForm.subassets?.find(
                                        (s: any) => s.id === a.id,
                                      )
                                    ) {
                                      setEditForm({
                                        ...editForm,
                                        subassets: [
                                          ...(editForm.subassets || []),
                                          a,
                                        ],
                                      });
                                    }
                                    setSubassetSearch("");
                                    setIsSubDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex justify-between items-center transition-colors"
                                >
                                  <span className="text-sm font-bold text-gray-900">
                                    {a.name}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                    {a.barcode || "N/A"}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-gray-900 mb-4">
                    Linked Subassets
                  </h3>
                  {(isEditing ? editForm.subassets : selectedAsset.subassets)
                    ?.length > 0 ? (
                    <div className="space-y-3">
                      {(isEditing
                        ? editForm.subassets
                        : selectedAsset.subassets
                      ).map((sub: any) => (
                        <div
                          key={sub.id}
                          className="p-4 border border-gray-200 rounded-xl flex justify-between items-center bg-white shadow-sm hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Layers className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-bold text-sm text-gray-900">
                              {sub.name}
                            </span>
                          </div>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm({
                                  ...editForm,
                                  subassets: editForm.subassets.filter(
                                    (s: any) => s.id !== sub.id,
                                  ),
                                });
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                      <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-500">
                        No subassets linked to this asset.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/*  UPDATED: PARTS TAB (WITH SEARCH AND LINKING)  */}
              {assetTab === "PARTS" && (
                <div className="max-w-3xl space-y-4">
                  {isEditing && (
                    <div className="relative mb-8 bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                      <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
                        Search & Add Inventory Part
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-blue-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          value={partSearch}
                          onChange={(e) => {
                            setPartSearch(e.target.value);
                            setIsPartDropdownOpen(true);
                          }}
                          onFocus={() => setIsPartDropdownOpen(true)}
                          onBlur={() =>
                            setTimeout(() => setIsPartDropdownOpen(false), 200)
                          }
                          placeholder="Search parts catalog by name..."
                          className="w-full pl-10 pr-4 py-2.5 border border-blue-200 shadow-sm rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        />
                        {isPartDropdownOpen && partSearch && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl z-20 max-h-48 overflow-y-auto">
                            {orgParts
                              .filter((p) =>
                                p.name
                                  ?.toLowerCase()
                                  .includes(partSearch.toLowerCase()),
                              )
                              .map((p) => (
                                <button
                                  type="button"
                                  key={p.id}
                                  onClick={() => {
                                    if (
                                      !editForm.parts?.find(
                                        (x: any) => x.id === p.id,
                                      )
                                    ) {
                                      setEditForm({
                                        ...editForm,
                                        parts: [...(editForm.parts || []), p],
                                      });
                                    }
                                    setPartSearch("");
                                    setIsPartDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex justify-between items-center transition-colors"
                                >
                                  <span className="text-sm font-bold text-gray-900">
                                    {p.name}
                                  </span>
                                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                    In Stock: {p.availableQty || 0}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-gray-900 mb-4">
                    Assigned Parts
                  </h3>
                  {(isEditing ? editForm.parts : selectedAsset.parts)?.length >
                  0 ? (
                    <div className="space-y-3">
                      {(isEditing ? editForm.parts : selectedAsset.parts).map(
                        (p: any) => (
                          <div
                            key={p.id}
                            className="p-4 border border-gray-200 rounded-xl flex justify-between items-center bg-white shadow-sm hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <Box className="w-5 h-5 text-blue-600" />
                              </div>
                              <span className="font-bold text-sm text-gray-900">
                                {p.name}
                              </span>
                            </div>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditForm({
                                    ...editForm,
                                    parts: editForm.parts.filter(
                                      (x: any) => x.id !== p.id,
                                    ),
                                  });
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                      <Box className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-500">
                        No inventory parts assigned to this asset.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/*  UPDATED: RELIABILITY TAB (WITH EDIT MODE)  */}
              {assetTab === "RELIABILITY" && (
                <div className="max-w-3xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-gray-900">
                      Uptime & Reliability Metrics
                    </h3>
                  </div>

                  {isEditing && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/30 p-5 rounded-2xl border border-blue-100 mb-6">
                      <div>
                        <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 block">
                          Uptime
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 99.8%"
                          value={editForm.uptime || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, uptime: e.target.value })
                          }
                          className="w-full border border-blue-200 shadow-sm rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 block">
                          Downtime
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1.2 hrs"
                          value={editForm.downtime || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              downtime: e.target.value,
                            })
                          }
                          className="w-full border border-blue-200 shadow-sm rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 block">
                          Reliability Score
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. A+"
                          value={editForm.reliabilityScore || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              reliabilityScore: e.target.value,
                            })
                          }
                          className="w-full border border-blue-200 shadow-sm rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-green-50 border border-green-100 rounded-xl shadow-sm">
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                        Uptime Recorded
                      </span>
                      <h4 className="text-3xl font-black text-green-800 mt-1">
                        {(isEditing ? editForm.uptime : selectedAsset.uptime) ||
                          "100%"}
                      </h4>
                    </div>
                    <div className="p-6 bg-orange-50 border border-orange-100 rounded-xl shadow-sm">
                      <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                        Downtime Recorded
                      </span>
                      <h4 className="text-3xl font-black text-orange-800 mt-1">
                        {(isEditing
                          ? editForm.downtime
                          : selectedAsset.downtime) || "0 hrs"}
                      </h4>
                    </div>
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl col-span-2 shadow-sm">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Reliability Score
                      </span>
                      <h4 className="text-3xl font-black text-blue-800 mt-1">
                        {(isEditing
                          ? editForm.reliabilityScore
                          : selectedAsset.reliabilityScore) || "A+"}
                      </h4>
                    </div>
                  </div>
                </div>
              )}

              {/* WORK ORDERS TAB */}
              {assetTab === "WORKORDERS" && (
                <div className="max-w-3xl space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-gray-900">
                      Related Work Orders
                    </h3>
                    <button
                      onClick={() => setIsCreateWOModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Create Work Order
                    </button>
                  </div>

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
                        onClick={() => setPreviewWO(wo)}
                        className="p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:border-blue-400 hover:shadow-md cursor-pointer transition-all bg-white group"
                      >
                        <span className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate pr-4">
                          WO-{wo.id}: {wo.title}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 uppercase tracking-wider ${wo.status === "OPEN" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}
                        >
                          {wo.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ACTIVITY LOG TAB */}
              {assetTab === "ACTIVITY" && (
                <div className="max-w-3xl space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-bold text-gray-900">
                      Asset History & Timeline
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {generateActivityLog(selectedAsset).map((log) => (
                      <div
                        key={log.id}
                        className={`p-4 border rounded-xl flex items-start gap-4 transition-all shadow-sm ${log.bgColor}`}
                      >
                        <div
                          className={`mt-0.5 p-2 rounded-lg border shadow-sm ${log.iconBg}`}
                        >
                          {log.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {log.title}
                          </p>
                          {log.subtitle && (
                            <p className="text-[13px] font-medium text-gray-600 mt-0.5">
                              {log.subtitle}
                            </p>
                          )}
                          <span className="text-[11px] font-bold text-gray-400 mt-1.5 block uppercase tracking-wider">
                            {new Date(log.date).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}

                    {generateActivityLog(selectedAsset).length === 0 && (
                      <p className="text-gray-500 text-sm">
                        No activity recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <CreateWorkOrderModal
          isOpen={isCreateWOModalOpen}
          onClose={() => setIsCreateWOModalOpen(false)}
          user={user}
          preSelectedAsset={selectedAsset}
          onCreated={() => {
            setIsCreateWOModalOpen(false);
            fetchData();
          }}
        />

        {/* WORK ORDER QUICK VIEW MODAL */}
        {previewWO && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[20px] shadow-2xl flex flex-col overflow-hidden transform transition-all">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    WO-{previewWO.id}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block uppercase tracking-wider ${previewWO.status === "OPEN" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                  >
                    {previewWO.status}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewWO(null)}
                  className="p-2 text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-sm border border-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Title
                  </h4>
                  <p className="text-sm font-bold text-gray-900">
                    {previewWO.title}
                  </p>
                </div>

                {previewWO.description && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Description
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {previewWO.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Priority
                    </h4>
                    <p className="text-sm font-medium text-gray-900">
                      {previewWO.priority || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Date Created
                    </h4>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(
                        previewWO.createdAt || Date.now(),
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setPreviewWO(null)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
                >
                  Close
                </button>

                {previewWO.status !== "COMPLETE" && (
                  <button
                    onClick={handleQuickCompleteWO}
                    disabled={isCompletingWO}
                    className="px-5 py-2.5 text-sm font-extrabold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isCompletingWO ? "Updating..." : "Mark Complete"}
                  </button>
                )}

                <button
                  onClick={() =>
                    window.open(
                      `/workspace/workorder/${previewWO.id}`,
                      "_blank",
                    )
                  }
                  className="px-6 py-2.5 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  Open Full Screen <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
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
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
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
