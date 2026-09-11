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
  MapPin,
  Settings2,
  Monitor,
  Headset,
  Hash,
  Laptop,
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

// Added Sub-categories for the Edit Dropdown
const SUB_CATEGORIES = ["PC", "HEADSET", "MACHINE", "MAT_VR", "VR_ARENA", "GENERAL"];

// --- INITIAL FALLBACK DATA ---
const INITIAL_VR_CONFIGS = [
  {
    id: "1",
    site: "USS Alabama",
    headset: "Vive Cosmos",
    machine: "4DX",
    pc: "Origin (Red PC)",
    serverIp: "10.0.0.99",
    dualEth: "Yes",
    notes: "",
  },
  {
    id: "2",
    site: "MSI",
    headset: "HP Reverb G2",
    machine: "4DX",
    pc: "Origin (Red PC)",
    serverIp: "10.0.0.99",
    dualEth: "Yes",
    notes: "",
  },
  {
    id: "3",
    site: "GAAQ",
    headset: "Vive Pro 2",
    machine: "4DX",
    pc: "Origin v3 (Black PC)",
    serverIp: "10.0.0.99",
    dualEth: "Yes",
    notes: "",
  },
  {
    id: "4",
    site: "Intrepid",
    headset: "DPVR E4C",
    machine: "4DX",
    pc: "Origin (Red PC)",
    serverIp: "10.0.0.99",
    dualEth: "Yes",
    notes: "",
  },
  {
    id: "5",
    site: "FMNH (VRT)",
    headset: "HP Reverb G2",
    machine: "4DX",
    pc: "Origin (Red PC)",
    serverIp: "192.168.1.99",
    dualEth: "No",
    notes: "",
  },
  {
    id: "6",
    site: "FMNH (DITO)",
    headset: "Oculus Quest2",
    machine: "DITO",
    pc: "N/A",
    serverIp: "DHCP",
    dualEth: "No",
    notes: "INUC Server",
  },
  {
    id: "7",
    site: "Brevard Zoo",
    headset: "PICO G3",
    machine: "MX4D",
    pc: "N/A",
    serverIp: "DHCP",
    dualEth: "No",
    notes: "",
  },
];

const INITIAL_PC_TRACKER = [
  {
    id: "1",
    label: "VR PC Red (VC###)",
    prefix: "VC",
    lastUsed: "VC171",
    brand: "Origin (Red PC)",
    assetName: "VR Client PC VC###",
  },
  {
    id: "2",
    label: "VR PC Black (BPC###)",
    prefix: "BPC",
    lastUsed: "BPC114",
    brand: "Origin v3 (Black PC)",
    assetName: "VR Client PC BPC###",
  },
  {
    id: "3",
    label: "VR PC MSI (VCM###)",
    prefix: "VCM",
    lastUsed: "VCM066",
    brand: "MSI Trident",
    assetName: "VR Client VCM###",
  },
  {
    id: "4",
    label: "Control PC (CPC###)",
    prefix: "CPC",
    lastUsed: "CPC213",
    brand: "Control PC",
    assetName: "Control PC CPC###",
  },
  {
    id: "5",
    label: "Mini PC (Mini###)",
    prefix: "Mini",
    lastUsed: "Mini 021",
    brand: "Intel NUC / Mini",
    assetName: "Mini PC Mini###",
  },
  {
    id: "6",
    label: "ADA PC (ADA###)",
    prefix: "ADA",
    lastUsed: "ADA 031",
    brand: "ADA PC",
    assetName: "ADA PC ADA###",
  },
  {
    id: "7",
    label: "Training PC (TPC###)",
    prefix: "TPC",
    lastUsed: "TPC012",
    brand: "Training PC",
    assetName: "Training PC TPC###",
  },
  {
    id: "8",
    label: "Photo PC (PHPC###)",
    prefix: "PHPC",
    lastUsed: "PHPC001",
    brand: "Photo PC",
    assetName: "Photo PC PHPC###",
  },
];

const INITIAL_HEADSET_TRACKER = [
  {
    id: "1",
    label: "DPVR (E4C###)",
    prefix: "E4C",
    lastUsed: "E4C153",
    model: "DPVR E4C",
    assetName: "Headset DP VR E4C###",
  },
  {
    id: "2",
    label: "HP Reverb (HP###)",
    prefix: "HP",
    lastUsed: "HP137",
    model: "HP Reverb G2",
    assetName: "Headset HP HP###",
  },
  {
    id: "3",
    label: "Vive Cosmos (HC###)",
    prefix: "HC",
    lastUsed: "HC036",
    model: "HTC Vive Cosmos",
    assetName: "Headset Vive Cosmos HC###",
  },
  {
    id: "4",
    label: "Vive Pro 2 (VP###)",
    prefix: "VP",
    lastUsed: "VP031",
    model: "HTC Vive Pro 2",
    assetName: "Headset Vive Pro VP###",
  },
  {
    id: "5",
    label: "Oculus Quest 2",
    prefix: "Q2",
    lastUsed: "Q2-050",
    model: "Meta Oculus Quest 2",
    assetName: "Headset Quest 2 Q2###",
  },
  {
    id: "6",
    label: "PICO G3",
    prefix: "PG3",
    lastUsed: "PG3-025",
    model: "PICO G3 VR",
    assetName: "Headset PICO G3 PG3###",
  },
];

const Assets = ({ user }: any) => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [orgParts, setOrgParts] = useState<any[]>([]);
  const [orgLocations, setOrgLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  const isFullAccess =
    user?.role === "ADMIN" ||
    user?.siteLocation?.toLowerCase().includes("shop") ||
    user?.siteLocation?.toLowerCase().includes("warehouse");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "OPERATIONAL" | "DAMAGED" | "VR_CONFIGS" | "PC_TRACKER" | "HEADSET_TRACKER"
  >("ALL");

  // --- NEW LOCATION FILTER STATE ---
  const [locationFilter, setLocationFilter] = useState("ALL");

  // UI States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateWOModalOpen, setIsCreateWOModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [previewWO, setPreviewWO] = useState<any | null>(null);
  const [isCompletingWO, setIsCompletingWO] = useState(false);
  const [assetTab, setAssetTab] = useState<
    "DETAILS" | "SUBASSETS" | "RELIABILITY" | "WORKORDERS" | "PARTS" | "ACTIVITY"
  >("DETAILS");
  const [selectedQrAsset, setSelectedQrAsset] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [subassetSearch, setSubassetSearch] = useState("");
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const [partSearch, setPartSearch] = useState("");
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);

  // --- DYNAMIC TRACKER STATES ---
  const [vrConfigs, setVrConfigs] = useState<any[]>(() => {
    const saved = localStorage.getItem("pulseworks_vr_configs");
    return saved ? JSON.parse(saved) : INITIAL_VR_CONFIGS;
  });
  const [pcTracker, setPcTracker] = useState<any[]>(() => {
    const saved = localStorage.getItem("pulseworks_pc_tracker");
    return saved ? JSON.parse(saved) : INITIAL_PC_TRACKER;
  });
  const [headsetTracker, setHeadsetTracker] = useState<any[]>(() => {
    const saved = localStorage.getItem("pulseworks_headset_tracker");
    return saved ? JSON.parse(saved) : INITIAL_HEADSET_TRACKER;
  });

  // Modal States for Trackers
  const [isVrModalOpen, setIsVrModalOpen] = useState(false);
  const [editingVrConfig, setEditingVrConfig] = useState<any>(null);
  const [vrConfigForm, setVrConfigForm] = useState({
    site: "",
    headset: "",
    machine: "",
    pc: "",
    serverIp: "",
    dualEth: "No",
    notes: "",
  });

  const [isPcModalOpen, setIsPcModalOpen] = useState(false);
  const [editingPcConfig, setEditingPcConfig] = useState<any>(null);
  const [pcConfigForm, setPcConfigForm] = useState({
    label: "",
    prefix: "",
    lastUsed: "",
    brand: "",
    assetName: "",
  });

  const [isHeadsetModalOpen, setIsHeadsetModalOpen] = useState(false);
  const [editingHeadsetConfig, setEditingHeadsetConfig] = useState<any>(null);
  const [headsetConfigForm, setHeadsetConfigForm] = useState({
    label: "",
    prefix: "",
    lastUsed: "",
    model: "",
    assetName: "",
  });

  // Persistence
  useEffect(
    () => localStorage.setItem("pulseworks_vr_configs", JSON.stringify(vrConfigs)),
    [vrConfigs],
  );
  useEffect(
    () => localStorage.setItem("pulseworks_pc_tracker", JSON.stringify(pcTracker)),
    [pcTracker],
  );
  useEffect(
    () => localStorage.setItem("pulseworks_headset_tracker", JSON.stringify(headsetTracker)),
    [headsetTracker],
  );

  const fetchData = async () => {
    try {
      const assetFetchUrl = isFullAccess
        ? `${API_URL}/api/assets?orgId=${user?.organizationId}`
        : `${API_URL}/api/assets?orgId=${user?.organizationId}&locationName=${encodeURIComponent(user?.siteLocation || "")}`;

      const [assetsRes, partsRes, locRes] = await Promise.all([
        fetch(assetFetchUrl),
        fetch(`${API_URL}/api/inventory?orgId=${user?.organizationId}`),
        fetch(`${API_URL}/api/locations?orgId=${user?.organizationId}`),
      ]);

      if (assetsRes.ok) {
        const freshAssets = await assetsRes.json();
        setAssets(freshAssets);
        if (selectedAsset) {
          const updatedSelected = freshAssets.find((a: any) => a.id === selectedAsset.id);
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

  const handleTrackerUpdate = (type: string, id: string, newLastUsed: string) => {
    if (type === "PC") {
      setPcTracker((prev) => prev.map((c) => (c.id === id ? { ...c, lastUsed: newLastUsed } : c)));
    } else if (type === "HEADSET") {
      setHeadsetTracker((prev) =>
        prev.map((c) => (c.id === id ? { ...c, lastUsed: newLastUsed } : c)),
      );
    }
  };

  // --- VR Config Handlers ---
  const handleOpenVrModal = (config: any = null) => {
    if (config) {
      setEditingVrConfig(config);
      setVrConfigForm(config);
    } else {
      setEditingVrConfig(null);
      setVrConfigForm({
        site: "",
        headset: "",
        machine: "",
        pc: "",
        serverIp: "",
        dualEth: "No",
        notes: "",
      });
    }
    setIsVrModalOpen(true);
  };
  const handleSaveVrConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVrConfig)
      setVrConfigs(
        vrConfigs.map((c) => (c.id === editingVrConfig.id ? { ...vrConfigForm, id: c.id } : c)),
      );
    else setVrConfigs([...vrConfigs, { ...vrConfigForm, id: Date.now().toString() }]);
    setIsVrModalOpen(false);
  };
  const handleDeleteVrConfig = (id: string) => {
    if (window.confirm("Are you sure you want to delete this VR configuration?"))
      setVrConfigs(vrConfigs.filter((c) => c.id !== id));
  };

  // --- PC Tracker Handlers ---
  const handleOpenPcModal = (config: any = null) => {
    if (config) {
      setEditingPcConfig(config);
      setPcConfigForm(config);
    } else {
      setEditingPcConfig(null);
      setPcConfigForm({ label: "", prefix: "", lastUsed: "", brand: "", assetName: "" });
    }
    setIsPcModalOpen(true);
  };
  const handleSavePcConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPcConfig)
      setPcTracker(
        pcTracker.map((c) => (c.id === editingPcConfig.id ? { ...pcConfigForm, id: c.id } : c)),
      );
    else setPcTracker([...pcTracker, { ...pcConfigForm, id: Date.now().toString() }]);
    setIsPcModalOpen(false);
  };
  const handleDeletePcConfig = (id: string) => {
    if (window.confirm("Are you sure you want to delete this PC type?"))
      setPcTracker(pcTracker.filter((c) => c.id !== id));
  };

  // --- Headset Tracker Handlers ---
  const handleOpenHeadsetModal = (config: any = null) => {
    if (config) {
      setEditingHeadsetConfig(config);
      setHeadsetConfigForm(config);
    } else {
      setEditingHeadsetConfig(null);
      setHeadsetConfigForm({ label: "", prefix: "", lastUsed: "", model: "", assetName: "" });
    }
    setIsHeadsetModalOpen(true);
  };
  const handleSaveHeadsetConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHeadsetConfig)
      setHeadsetTracker(
        headsetTracker.map((c) =>
          c.id === editingHeadsetConfig.id ? { ...headsetConfigForm, id: c.id } : c,
        ),
      );
    else
      setHeadsetTracker([...headsetTracker, { ...headsetConfigForm, id: Date.now().toString() }]);
    setIsHeadsetModalOpen(false);
  };
  const handleDeleteHeadsetConfig = (id: string) => {
    if (window.confirm("Are you sure you want to delete this headset model?"))
      setHeadsetTracker(headsetTracker.filter((c) => c.id !== id));
  };

  // --- Asset DB Handlers ---
  const handleRowClick = (asset: any) => {
    setSelectedAsset(asset);
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
      const { id, workOrders, organization, createdAt, updatedAt, parentAsset, ...safePayload } =
        editForm;

      safePayload.subassets = {
        set: editForm.subassets?.map((s: any) => ({ id: s.id })) || [],
      };
      safePayload.parts = {
        set: editForm.parts?.map((p: any) => ({ id: p.id })) || [],
      };

      const res = await fetch(`${API_URL}/api/assets/${selectedAsset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safePayload),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchData();
      } else {
        alert(`Failed to update asset.`);
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await fetch(`${API_URL}/api/assets/${id}`, {
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
      const res = await fetch(`${API_URL}/api/workorders/${previewWO.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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

  // --- UPDATED FILTERING LOGIC FOR ASSETS ---
  const filteredAssets = assets.filter((asset) => {
    let matches = true;

    // Status Filter
    if (statusFilter === "OPERATIONAL" || statusFilter === "DAMAGED") {
      matches = matches && asset.status === statusFilter;
    }

    // Location Filter
    if (locationFilter !== "ALL") {
      matches = matches && asset.locationName === locationFilter;
    }

    // Search Query Filter
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

  const filteredVrConfigs = vrConfigs.filter(
    (c) =>
      c.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.headset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pc.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredPcTracker = pcTracker.filter(
    (c) =>
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastUsed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assetName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredHeadsetTracker = headsetTracker.filter(
    (c) =>
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastUsed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assetName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const operationalCount = assets.filter((a) => a.status === "OPERATIONAL").length;
  const damagedCount = assets.filter((a) => a.status === "DAMAGED").length;

  // =========================================================================
  // FULL SCREEN DETAIL VIEW
  // =========================================================================
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
        new Date(asset.updatedAt).getTime() > new Date(asset.createdAt).getTime() + 5000
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
            title: isMovement ? "Asset Location Moved" : `Work Order Opened: WO-${wo.id}`,
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
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedAsset(null)}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-gray-900 text-base md:text-lg truncate max-w-[200px] md:max-w-none">
              Asset: {selectedAsset.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold ${selectedAsset.status === "OPERATIONAL" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
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

        <div className="flex flex-1 overflow-hidden pb-20 md:pb-0">
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="px-6 md:px-10 pt-6 md:pt-8 pb-6 shrink-0 relative border-b border-gray-100">
              {isEditing ? (
                <form onSubmit={handleUpdateAsset} className="space-y-4 max-w-4xl w-full">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Asset Name
                    </label>
                    <input
                      className="w-full text-lg md:text-xl font-black text-gray-900 border border-gray-200 rounded-xl px-4 py-3 outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all shadow-sm"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Description & Notes
                    </label>
                    <textarea
                      className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-4 py-3 outline-none min-h-[160px] resize-y bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all shadow-sm"
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Add asset specifications, installation notes, etc..."
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none px-8 py-3.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 text-sm"
                    >
                      Save All Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({ ...selectedAsset });
                      }}
                      className="flex-1 sm:flex-none px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 max-w-4xl">
                  <div className="w-full">
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-1">
                      {selectedAsset.name}
                    </h1>
                    <p className="text-sm text-gray-500 whitespace-pre-wrap mt-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      {selectedAsset.description || "No description provided."}
                    </p>
                  </div>
                  {isFullAccess && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center gap-1.5 px-6 py-3 w-full sm:w-auto text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors shrink-0"
                    >
                      <Pencil className="w-4 h-4" /> Edit Asset
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="px-6 md:px-10 border-b border-gray-200 flex gap-6 md:gap-8 shrink-0 overflow-x-auto no-scrollbar w-full min-w-0">
              {["DETAILS", "SUBASSETS", "RELIABILITY", "WORKORDERS", "PARTS", "ACTIVITY"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setAssetTab(tab as any)}
                    className={`pb-3 text-sm font-bold tracking-wide transition-colors relative whitespace-nowrap ${assetTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    {tab === "WORKORDERS"
                      ? "Work Orders"
                      : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    {assetTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                    )}
                  </button>
                ),
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 bg-white">
              {assetTab === "DETAILS" && (
                <div className="max-w-4xl space-y-6">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-blue-600" />
                    Asset Specifications
                  </h3>

                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-colors">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Location
                        </label>
                        {isFullAccess ? (
                          <select
                            value={editForm.locationName || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, locationName: e.target.value })
                            }
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                          >
                            <option value="">Select location...</option>
                            {orgLocations.map((loc: any) => (
                              <option key={loc.id} value={loc.name}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-500">
                            {selectedAsset.locationName || "—"}
                          </div>
                        )}
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-colors">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Sub-Category
                        </label>
                        <select
                          value={editForm.subCategory || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, subCategory: e.target.value })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                        >
                          <option value="">Select sub-category...</option>
                          {SUB_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-colors">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" /> Serial Number
                        </label>
                        <input
                          type="text"
                          value={editForm.serialNumber || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, serialNumber: e.target.value })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                        />
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-colors">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5" /> Barcode
                        </label>
                        <input
                          type="text"
                          value={editForm.barcode || ""}
                          onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                        />
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-colors sm:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5" /> Model / Brand
                        </label>
                        <input
                          type="text"
                          value={editForm.model || ""}
                          onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl flex flex-col gap-1.5 hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-sm transition-all">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Location
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {selectedAsset.locationName || "—"}
                        </span>
                      </div>

                      <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl flex flex-col gap-1.5 hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-sm transition-all">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Sub-Category
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {selectedAsset.subCategory?.replace(/_/g, " ") ||
                            selectedAsset.category?.replace(/_/g, " ") ||
                            "—"}
                        </span>
                      </div>

                      <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl flex flex-col gap-1.5 hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-sm transition-all">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" /> Serial Number
                        </span>
                        <span className="text-sm font-bold text-gray-900 font-mono">
                          {selectedAsset.serialNumber || "—"}
                        </span>
                      </div>

                      <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl flex flex-col gap-1.5 hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-sm transition-all">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5" /> Barcode
                        </span>
                        <span className="text-sm font-bold text-gray-900 font-mono">
                          {selectedAsset.barcode || "—"}
                        </span>
                      </div>

                      <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl flex flex-col gap-1.5 hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-sm transition-all sm:col-span-2 lg:col-span-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5" /> Model / Brand
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {selectedAsset.model || "—"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                          onBlur={() => setTimeout(() => setIsSubDropdownOpen(false), 200)}
                          placeholder="Search assets by name or barcode..."
                          className="w-full pl-10 pr-4 py-2.5 border border-blue-200 shadow-sm rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                        {isSubDropdownOpen && subassetSearch && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl z-20 max-h-48 overflow-y-auto">
                            {assets
                              .filter(
                                (a) =>
                                  a.id !== selectedAsset.id &&
                                  (a.name?.toLowerCase().includes(subassetSearch.toLowerCase()) ||
                                    a.barcode
                                      ?.toLowerCase()
                                      .includes(subassetSearch.toLowerCase())),
                              )
                              .map((a) => (
                                <button
                                  type="button"
                                  key={a.id}
                                  onClick={() => {
                                    if (!editForm.subassets?.find((s: any) => s.id === a.id)) {
                                      setEditForm({
                                        ...editForm,
                                        subassets: [...(editForm.subassets || []), a],
                                      });
                                    }
                                    setSubassetSearch("");
                                    setIsSubDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 flex justify-between items-center"
                                >
                                  <span className="text-sm font-bold text-gray-900">{a.name}</span>
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

                  <h3 className="text-base font-bold text-gray-900 mb-4">Linked Subassets</h3>
                  {(isEditing ? editForm.subassets : selectedAsset.subassets)?.length > 0 ? (
                    <div className="space-y-3">
                      {(isEditing ? editForm.subassets : selectedAsset.subassets).map(
                        (sub: any) => (
                          <div
                            key={sub.id}
                            className="p-4 border border-gray-200 rounded-xl flex justify-between items-center bg-white shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <Layers className="w-5 h-5 text-blue-600" />
                              </div>
                              <span className="font-bold text-sm text-gray-900">{sub.name}</span>
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
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
                      <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-500">
                        No subassets linked to this asset.
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                          onBlur={() => setTimeout(() => setIsPartDropdownOpen(false), 200)}
                          placeholder="Search parts catalog by name..."
                          className="w-full pl-10 pr-4 py-2.5 border border-blue-200 shadow-sm rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                        {isPartDropdownOpen && partSearch && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl z-20 max-h-48 overflow-y-auto">
                            {orgParts
                              .filter((p) =>
                                p.name?.toLowerCase().includes(partSearch.toLowerCase()),
                              )
                              .map((p) => (
                                <button
                                  type="button"
                                  key={p.id}
                                  onClick={() => {
                                    if (!editForm.parts?.find((x: any) => x.id === p.id)) {
                                      setEditForm({
                                        ...editForm,
                                        parts: [...(editForm.parts || []), p],
                                      });
                                    }
                                    setPartSearch("");
                                    setIsPartDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 flex justify-between items-center"
                                >
                                  <span className="text-sm font-bold text-gray-900">{p.name}</span>
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

                  <h3 className="text-base font-bold text-gray-900 mb-4">Assigned Parts</h3>
                  {(isEditing ? editForm.parts : selectedAsset.parts)?.length > 0 ? (
                    <div className="space-y-3">
                      {(isEditing ? editForm.parts : selectedAsset.parts).map((p: any) => (
                        <div
                          key={p.id}
                          className="p-4 border border-gray-200 rounded-xl flex justify-between items-center bg-white shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Box className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-bold text-sm text-gray-900">{p.name}</span>
                          </div>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm({
                                  ...editForm,
                                  parts: editForm.parts.filter((x: any) => x.id !== p.id),
                                });
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
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

              {assetTab === "RELIABILITY" && (
                <div className="max-w-3xl space-y-6">
                  <h3 className="text-base font-bold text-gray-900">
                    Uptime & Reliability Metrics
                  </h3>

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
                          onChange={(e) => setEditForm({ ...editForm, uptime: e.target.value })}
                          className="w-full border border-blue-200 shadow-sm rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
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
                          className="w-full border border-blue-200 shadow-sm rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
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
                          className="w-full border border-blue-200 shadow-sm rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-green-50 border border-green-100 rounded-xl shadow-sm">
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                        Uptime Recorded
                      </span>
                      <h4 className="text-3xl font-black text-green-800 mt-1">
                        {(isEditing ? editForm.uptime : selectedAsset.uptime) || "100%"}
                      </h4>
                    </div>
                    <div className="p-6 bg-orange-50 border border-orange-100 rounded-xl shadow-sm">
                      <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                        Downtime Recorded
                      </span>
                      <h4 className="text-3xl font-black text-orange-800 mt-1">
                        {(isEditing ? editForm.downtime : selectedAsset.downtime) || "0 hrs"}
                      </h4>
                    </div>
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl sm:col-span-2 shadow-sm">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Reliability Score
                      </span>
                      <h4 className="text-3xl font-black text-blue-800 mt-1">
                        {(isEditing ? editForm.reliabilityScore : selectedAsset.reliabilityScore) ||
                          "A+"}
                      </h4>
                    </div>
                  </div>
                </div>
              )}

              {assetTab === "WORKORDERS" && (
                <div className="max-w-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <h3 className="text-base font-bold text-gray-900">Related Work Orders</h3>
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

              {assetTab === "ACTIVITY" && (
                <div className="max-w-3xl space-y-4">
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    Asset History & Timeline
                  </h3>

                  <div className="space-y-3">
                    {generateActivityLog(selectedAsset).map((log) => (
                      <div
                        key={log.id}
                        className={`p-4 border rounded-xl flex items-start gap-4 transition-all shadow-sm ${log.bgColor}`}
                      >
                        <div className={`mt-0.5 p-2 rounded-lg border shadow-sm ${log.iconBg}`}>
                          {log.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{log.title}</p>
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
                      <p className="text-gray-500 text-sm">No activity recorded yet.</p>
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

        {previewWO && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[20px] shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-black text-gray-900">WO-{previewWO.id}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block uppercase tracking-wider ${previewWO.status === "OPEN" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                  >
                    {previewWO.status}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewWO(null)}
                  className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full shadow-sm border border-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Title
                  </h4>
                  <p className="text-sm font-bold text-gray-900">{previewWO.title}</p>
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
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 pb-8 md:pb-4">
                <button
                  onClick={() => setPreviewWO(null)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl"
                >
                  Close
                </button>
                {previewWO.status !== "COMPLETE" && (
                  <button
                    onClick={handleQuickCompleteWO}
                    disabled={isCompletingWO}
                    className="px-5 py-2.5 text-sm font-extrabold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isCompletingWO ? "Updating..." : "Mark Complete"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans pb-20 md:pb-0">
      <div className="p-4 md:p-8 pb-0 shrink-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
          <div className="flex-1 min-w-0 w-full">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Assets</h1>

            <div className="flex gap-4 md:gap-6 mt-4 text-xs md:text-sm font-bold border-b border-gray-200 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`pb-3 relative transition-colors whitespace-nowrap ${statusFilter === "ALL" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                Total assets{" "}
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] md:text-[11px] ${statusFilter === "ALL" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {assets.length}
                </span>
                {statusFilter === "ALL" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                )}
              </button>

              <button
                onClick={() => setStatusFilter("OPERATIONAL")}
                className={`pb-3 relative transition-colors whitespace-nowrap ${statusFilter === "OPERATIONAL" ? "text-green-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                Operational{" "}
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] md:text-[11px] ${statusFilter === "OPERATIONAL" ? "bg-green-100 text-green-700" : "bg-green-50 text-green-600"}`}
                >
                  {operationalCount}
                </span>
                {statusFilter === "OPERATIONAL" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full"></div>
                )}
              </button>

              <button
                onClick={() => setStatusFilter("DAMAGED")}
                className={`pb-3 relative transition-colors whitespace-nowrap ${statusFilter === "DAMAGED" ? "text-red-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                Not Operational{" "}
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] md:text-[11px] ${statusFilter === "DAMAGED" ? "bg-red-100 text-red-700" : "bg-red-50 text-red-600"}`}
                >
                  {damagedCount}
                </span>
                {statusFilter === "DAMAGED" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-t-full"></div>
                )}
              </button>

              {isFullAccess && (
                <>
                  <button
                    onClick={() => setStatusFilter("VR_CONFIGS")}
                    className={`pb-3 relative transition-colors whitespace-nowrap ${statusFilter === "VR_CONFIGS" ? "text-purple-600" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    VR Config Sheet
                    {statusFilter === "VR_CONFIGS" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t-full"></div>
                    )}
                  </button>

                  <button
                    onClick={() => setStatusFilter("PC_TRACKER")}
                    className={`pb-3 relative transition-colors whitespace-nowrap ${statusFilter === "PC_TRACKER" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    PC S/N Tracker
                    {statusFilter === "PC_TRACKER" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>
                    )}
                  </button>

                  <button
                    onClick={() => setStatusFilter("HEADSET_TRACKER")}
                    className={`pb-3 relative transition-colors whitespace-nowrap ${statusFilter === "HEADSET_TRACKER" ? "text-pink-600" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Headset S/N Tracker
                    {statusFilter === "HEADSET_TRACKER" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-t-full"></div>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Only Full Access users can globally create assets or configs */}
          {isFullAccess && (
            <button
              onClick={() => {
                if (statusFilter === "VR_CONFIGS") handleOpenVrModal();
                else if (statusFilter === "PC_TRACKER") handleOpenPcModal();
                else if (statusFilter === "HEADSET_TRACKER") handleOpenHeadsetModal();
                else setIsCreateModalOpen(true);
              }}
              className="hidden md:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-4 py-2 rounded-xl text-sm font-bold items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              {statusFilter === "VR_CONFIGS"
                ? "Add Configuration"
                : statusFilter === "PC_TRACKER"
                  ? "Add PC Type"
                  : statusFilter === "HEADSET_TRACKER"
                    ? "Add Headset Model"
                    : "Create Asset"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 md:px-8 pb-8 flex flex-col">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-white shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-2xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={
                    statusFilter === "VR_CONFIGS"
                      ? "Search configs by site, pc, or headset..."
                      : statusFilter === "PC_TRACKER"
                        ? "Search PC types or serial numbers..."
                        : statusFilter === "HEADSET_TRACKER"
                          ? "Search headset models or serial numbers..."
                          : "Search by name, barcode, serial..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                />
              </div>

              {/* LOCATION FILTER - ONLY SHOW ON ASSET TABS */}
              {(statusFilter === "ALL" ||
                statusFilter === "OPERATIONAL" ||
                statusFilter === "DAMAGED") && (
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm cursor-pointer"
                >
                  <option value="ALL">All Locations</option>
                  {orgLocations.map((loc: any) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {isFullAccess && (
              <button
                onClick={() => {
                  if (statusFilter === "VR_CONFIGS") handleOpenVrModal();
                  else if (statusFilter === "PC_TRACKER") handleOpenPcModal();
                  else if (statusFilter === "HEADSET_TRACKER") handleOpenHeadsetModal();
                  else setIsCreateModalOpen(true);
                }}
                className="md:hidden mt-3 sm:mt-0 w-full bg-blue-600 text-white p-2.5 rounded-xl shadow-md shrink-0 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {statusFilter === "VR_CONFIGS"
                  ? "Add Config"
                  : statusFilter === "PC_TRACKER"
                    ? "Add PC"
                    : statusFilter === "HEADSET_TRACKER"
                      ? "Add Headset"
                      : "Create"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-0 bg-gray-50/30">
            {/* --- PC S/N TRACKER VIEW --- */}
            {statusFilter === "PC_TRACKER" && isFullAccess ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Asset Designation Label
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Brand / Model
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Prefix Code
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Last Used S/N
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-indigo-500 uppercase tracking-wider bg-indigo-50/50">
                      Asset Name Format
                    </th>
                    <th className="px-6 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredPcTracker.length > 0 ? (
                    filteredPcTracker.map((config) => (
                      <tr key={config.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {config.label}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {config.brand}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500 bg-gray-50/50">
                          {config.prefix}
                        </td>
                        <td className="px-6 py-4 text-sm font-black font-mono text-indigo-700 bg-indigo-50/30">
                          {config.lastUsed}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-indigo-700">
                          {config.assetName || "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenPcModal(config)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePcConfig(config.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500 font-medium">
                        No PC types found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : /* --- HEADSET S/N TRACKER VIEW --- */
            statusFilter === "HEADSET_TRACKER" && isFullAccess ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Asset Designation Label
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Headset Model
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Prefix Code
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Last Used S/N
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-pink-500 uppercase tracking-wider bg-pink-50/50">
                      Asset Name Format
                    </th>
                    <th className="px-6 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredHeadsetTracker.length > 0 ? (
                    filteredHeadsetTracker.map((config) => (
                      <tr key={config.id} className="hover:bg-pink-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {config.label}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {config.model}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500 bg-gray-50/50">
                          {config.prefix}
                        </td>
                        <td className="px-6 py-4 text-sm font-black font-mono text-pink-700 bg-pink-50/30">
                          {config.lastUsed}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-pink-700">
                          {config.assetName || "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenHeadsetModal(config)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHeadsetConfig(config.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500 font-medium">
                        No Headset models found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : /* --- VR CONFIG SHEET VIEW --- */
            statusFilter === "VR_CONFIGS" && isFullAccess ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Headset Type
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Machine Type
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      PC Brand/Style
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Server IP
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Dual Ethernet
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredVrConfigs.length > 0 ? (
                    filteredVrConfigs.map((config) => (
                      <tr key={config.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{config.site}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {config.headset}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500 bg-gray-50/50">
                          {config.machine}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{config.pc}</td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500 bg-gray-50/50">
                          {config.serverIp}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${config.dualEth === "Yes" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {config.dualEth}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 italic max-w-[150px] truncate">
                          {config.notes || "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenVrModal(config)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVrConfig(config.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500 font-medium">
                        No VR configs found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : /* --- NORMAL ASSET VIEW --- */
            loading ? (
              <div className="text-center py-16 text-gray-500 font-medium">Loading assets...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                  <Box className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No assets found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setLocationFilter("ALL");
                  }}
                  className="mt-3 text-sm text-blue-600 font-bold hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                <div className="md:hidden space-y-4">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleRowClick(asset)}
                      className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-blue-100">
                            <Box className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                              {asset.name}
                            </h3>
                            <span className="text-xs font-semibold text-gray-400">
                              {asset.subCategory?.replace(/_/g, " ") ||
                                asset.category?.replace(/_/g, " ") ||
                                "GENERAL"}
                            </span>
                          </div>
                        </div>

                        {asset.status === "OPERATIONAL" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                            Operational
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Damaged
                          </span>
                        )}
                      </div>

                      <div className="bg-gray-50/60 p-3 rounded-xl border border-gray-100 space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-blue-500 shrink-0" />
                          <span className="truncate">Location: {asset.locationName || "—"}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-200/50">
                          <span className="font-mono text-gray-500">
                            Barcode: {asset.barcode || "—"}
                          </span>
                          {(asset.barcode || asset.serialNumber) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQrAsset(asset);
                              }}
                              className="text-blue-600 font-bold flex items-center gap-1"
                            >
                              <QrCode className="w-4 h-4" /> QR
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <table className="hidden md:table min-w-full divide-y divide-gray-200">
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
                    {filteredAssets.map((asset) => (
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
                                {asset.subCategory?.replace(/_/g, " ") ||
                                  asset.category?.replace(/_/g, " ") ||
                                  "GENERAL"}
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
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- CREATION MODALS --- */}
      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
        onCreated={fetchData}
        pcTracker={pcTracker}
        headsetTracker={headsetTracker}
        vrConfigs={vrConfigs}
        onTrackerUpdate={handleTrackerUpdate}
      />

      {/* VR CONFIG EDIT MODAL */}
      {isVrModalOpen && isFullAccess && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-gray-900/60 backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 max-h-[92vh]">
            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    {editingVrConfig ? "Edit VR Config" : "Add VR Config"}
                  </h2>
                  <p className="text-[11px] md:text-xs font-medium text-gray-500 mt-0.5">
                    Configure deployment specifications for a client site.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVrModalOpen(false)}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVrConfig} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                      Site / Location Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={vrConfigForm.site}
                      onChange={(e) => setVrConfigForm({ ...vrConfigForm, site: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-sm text-gray-900"
                      placeholder="e.g. Intrepid Sea Air & Space"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                      Server IP Address
                    </label>
                    <input
                      type="text"
                      value={vrConfigForm.serverIp}
                      onChange={(e) =>
                        setVrConfigForm({ ...vrConfigForm, serverIp: e.target.value })
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-sm text-gray-900 font-mono"
                      placeholder="e.g. 10.0.0.99"
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                        Machine Type
                      </label>
                      <input
                        type="text"
                        value={vrConfigForm.machine}
                        onChange={(e) =>
                          setVrConfigForm({ ...vrConfigForm, machine: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 transition-all text-gray-900"
                        placeholder="e.g. 4DX"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                        Headset Type
                      </label>
                      <input
                        type="text"
                        value={vrConfigForm.headset}
                        onChange={(e) =>
                          setVrConfigForm({ ...vrConfigForm, headset: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 transition-all text-gray-900"
                        placeholder="e.g. DPVR E4C"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                        PC Brand / Style
                      </label>
                      <input
                        type="text"
                        value={vrConfigForm.pc}
                        onChange={(e) => setVrConfigForm({ ...vrConfigForm, pc: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 transition-all text-gray-900"
                        placeholder="e.g. Origin (Red PC)"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                        Dual Ethernet?
                      </label>
                      <select
                        value={vrConfigForm.dualEth}
                        onChange={(e) =>
                          setVrConfigForm({ ...vrConfigForm, dualEth: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all text-gray-900 cursor-pointer"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={vrConfigForm.notes}
                    onChange={(e) => setVrConfigForm({ ...vrConfigForm, notes: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-sm text-gray-900 resize-y"
                    placeholder="Any special instructions or INUC server notes..."
                  />
                </div>
              </div>

              <div className="p-6 md:p-8 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0 pb-8 md:pb-6">
                <button
                  type="button"
                  onClick={() => setIsVrModalOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md active:scale-95 transition-all"
                >
                  Save Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PC TRACKER EDIT MODAL */}
      {isPcModalOpen && isFullAccess && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-gray-900/60 backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 max-h-[92vh]">
            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    {editingPcConfig ? "Edit PC Tracker" : "Add PC Type"}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPcModalOpen(false)}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePcConfig} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8 space-y-5 custom-scrollbar">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Designation Label (Dropdown Display) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. VR PC Red (VC###)"
                    value={pcConfigForm.label}
                    onChange={(e) => setPcConfigForm({ ...pcConfigForm, label: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    S/N Prefix Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. VC"
                    value={pcConfigForm.prefix}
                    onChange={(e) => setPcConfigForm({ ...pcConfigForm, prefix: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-indigo-500 uppercase tracking-wider mb-1.5">
                    Last Used Serial Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. VC171"
                    value={pcConfigForm.lastUsed}
                    onChange={(e) => setPcConfigForm({ ...pcConfigForm, lastUsed: e.target.value })}
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm text-indigo-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    PC Brand / Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Origin (Red PC)"
                    value={pcConfigForm.brand}
                    onChange={(e) => setPcConfigForm({ ...pcConfigForm, brand: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-indigo-500 uppercase tracking-wider mb-1.5">
                    Asset Name Format <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. VR Client PC"
                    value={pcConfigForm.assetName}
                    onChange={(e) =>
                      setPcConfigForm({ ...pcConfigForm, assetName: e.target.value })
                    }
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm text-indigo-900"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 font-medium">
                    The new Serial Number will automatically be appended to the end of this name.
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0 pb-8 md:pb-6">
                <button
                  type="button"
                  onClick={() => setIsPcModalOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md active:scale-95 transition-all"
                >
                  Save PC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADSET TRACKER EDIT MODAL */}
      {isHeadsetModalOpen && isFullAccess && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-gray-900/60 backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 max-h-[92vh]">
            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl shadow-sm border border-pink-100">
                  <Headset className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    {editingHeadsetConfig ? "Edit Headset" : "Add Headset"}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHeadsetModalOpen(false)}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveHeadsetConfig}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8 space-y-5 custom-scrollbar">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Designation Label (Dropdown Display) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. DPVR (E4C###)"
                    value={headsetConfigForm.label}
                    onChange={(e) =>
                      setHeadsetConfigForm({ ...headsetConfigForm, label: e.target.value })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-600 transition-all shadow-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    S/N Prefix Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. E4C"
                    value={headsetConfigForm.prefix}
                    onChange={(e) =>
                      setHeadsetConfigForm({ ...headsetConfigForm, prefix: e.target.value })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-600 transition-all shadow-sm text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-pink-500 uppercase tracking-wider mb-1.5">
                    Last Used Serial Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. E4C153"
                    value={headsetConfigForm.lastUsed}
                    onChange={(e) =>
                      setHeadsetConfigForm({ ...headsetConfigForm, lastUsed: e.target.value })
                    }
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-pink-600 transition-all shadow-sm text-pink-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Full Headset Model Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. DPVR E4C"
                    value={headsetConfigForm.model}
                    onChange={(e) =>
                      setHeadsetConfigForm({ ...headsetConfigForm, model: e.target.value })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-600 transition-all shadow-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-pink-500 uppercase tracking-wider mb-1.5">
                    Asset Name Format <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Headset DP VR"
                    value={headsetConfigForm.assetName}
                    onChange={(e) =>
                      setHeadsetConfigForm({ ...headsetConfigForm, assetName: e.target.value })
                    }
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-600 transition-all shadow-sm text-pink-900"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 font-medium">
                    The new Serial Number will automatically be appended to the end of this name.
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0 pb-8 md:pb-6">
                <button
                  type="button"
                  onClick={() => setIsHeadsetModalOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 text-sm font-black text-white bg-pink-600 hover:bg-pink-700 rounded-xl shadow-md active:scale-95 transition-all"
                >
                  Save Headset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedQrAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl relative w-full max-w-sm flex flex-col items-center p-8 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedQrAsset(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Asset Tag</h2>
            <p className="text-sm text-gray-500 mb-6 text-center line-clamp-1">
              {selectedQrAsset.name}
            </p>

            <AssetQRCode
              assetName={selectedQrAsset.name}
              barcodeValue={selectedQrAsset.barcode || selectedQrAsset.serialNumber}
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default Assets;
