/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const SUB_CATEGORIES = ["PC", "HEADSET", "MACHINE", "MAT_VR", "VR_ARENA", "GENERAL"];

const Assets = ({ user }: any) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assets, setAssets] = useState<any[]>([]);
  const [orgParts, setOrgParts] = useState<any[]>([]);
  const [orgLocations, setOrgLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  const currentOrgId = user?.organizationId || user?.orgId || user?.organization_id;

  // Presets & Templates state
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [machineUnits, setMachineUnits] = useState<any[]>([]);

  // Inline Editing States
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [editingMachineName, setEditingMachineName] = useState("");

  const isFullAccess =
    user?.role === "ADMIN" ||
    user?.siteLocation?.toLowerCase().includes("shop") ||
    user?.siteLocation?.toLowerCase().includes("warehouse");

  // --- URL STATE PERSISTENCE ---
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "OPERATIONAL" | "DAMAGED" | "VR_CONFIGS" | "PC_TRACKER" | "HEADSET_TRACKER" | "HARDWARE_TEMPLATES"
  >((searchParams.get("tab") as any) || "ALL");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "ALL");

  useEffect(() => {
    const params: any = {};
    if (searchQuery) params.search = searchQuery;
    if (statusFilter !== "ALL") params.tab = statusFilter;
    if (locationFilter !== "ALL") params.location = locationFilter;

    setSearchParams(params, { replace: true });
  }, [searchQuery, statusFilter, locationFilter, setSearchParams]);

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

  // Modal states for direct hardware creation
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [isSavingCat, setIsSavingCat] = useState(false);

  const [isAddMachineModalOpen, setIsAddMachineModalOpen] = useState(false);
  const [newMachineInput, setNewMachineInput] = useState("");
  const [isSavingMachine, setIsSavingMachine] = useState(false);

  // --- DYNAMIC TRACKER STATES ---
  const [vrConfigs, setVrConfigs] = useState<any[]>(() => {
    const saved = localStorage.getItem("pulseworks_vr_configs");
    return saved ? JSON.parse(saved) : [];
  });
  const [pcTracker, setPcTracker] = useState<any[]>(() => {
    const saved = localStorage.getItem("pulseworks_pc_tracker");
    return saved ? JSON.parse(saved) : [];
  });
  const [headsetTracker, setHeadsetTracker] = useState<any[]>(() => {
    const saved = localStorage.getItem("pulseworks_headset_tracker");
    return saved ? JSON.parse(saved) : [];
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
      if (!currentOrgId) return;

      const assetFetchUrl = isFullAccess
        ? `${API_URL}/api/assets?orgId=${currentOrgId}`
        : `${API_URL}/api/assets?orgId=${currentOrgId}&locationName=${encodeURIComponent(user?.siteLocation || "")}`;

      const [assetsRes, partsRes, locRes, catRes, machRes] = await Promise.all([
        fetch(assetFetchUrl),
        fetch(`${API_URL}/api/inventory?orgId=${currentOrgId}`),
        fetch(`${API_URL}/api/locations?orgId=${currentOrgId}`),
        fetch(`${API_URL}/api/equipment-categories?orgId=${currentOrgId}`),
        fetch(`${API_URL}/api/machine-types?orgId=${currentOrgId}`),
      ]);

      if (assetsRes.ok) {
        const freshAssets = await assetsRes.json();
        setAssets(Array.isArray(freshAssets) ? freshAssets : []);
        if (selectedAsset) {
          const updatedSelected = (Array.isArray(freshAssets) ? freshAssets : []).find(
            (a: any) => a.id === selectedAsset.id,
          );
          if (updatedSelected) setSelectedAsset(updatedSelected);
        }
      }

      if (partsRes.ok) {
        const partsData = await partsRes.json();
        setOrgParts(Array.isArray(partsData) ? partsData : []);
      }
      if (locRes.ok) {
        const locData = await locRes.json();
        setOrgLocations(Array.isArray(locData) ? locData : []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCustomCategories(Array.isArray(catData) ? catData : []);
      }
      if (machRes.ok) {
        const machData = await machRes.json();
        setMachineUnits(Array.isArray(machData) ? machData : []);
      }
    } catch (err) {
      console.error("Failed to fetch assets data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrgId) fetchData();
  }, [currentOrgId]);

  // Combined and deduplicated locations
  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();

    if (Array.isArray(orgLocations)) {
      orgLocations.forEach((l) => {
        const name = typeof l === "string" ? l : l?.name;
        if (name && name.trim() && name !== "-") locSet.add(name.trim());
      });
    }

    if (Array.isArray(assets)) {
      assets.forEach((a) => {
        const loc = a.locationName || a.location || a.siteLocation;
        if (loc && loc.trim() && loc !== "-") locSet.add(loc.trim());
      });
    }

    return Array.from(locSet).sort();
  }, [orgLocations, assets]);

  const handleTrackerUpdate = (type: string, id: string, newLastUsed: string) => {
    if (type === "PC") {
      setPcTracker((prev) => prev.map((c) => (c.id === id ? { ...c, lastUsed: newLastUsed } : c)));
    } else if (type === "HEADSET") {
      setHeadsetTracker((prev) =>
        prev.map((c) => (c.id === id ? { ...c, lastUsed: newLastUsed } : c)),
      );
    }
  };

  // --- Hardware Preset Handlers ---
  const handleDirectCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;

    if (!currentOrgId) {
      alert("Organization identifier is missing. Please re-login.");
      return;
    }

    setIsSavingCat(true);
    try {
      const res = await fetch(`${API_URL}/api/equipment-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: currentOrgId,
          organizationId: currentOrgId,
          name: newCatInput.trim(),
          role: user?.role || "ADMIN",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setCustomCategories((prev) => [...prev, data]);
        setNewCatInput("");
        setIsAddCatModalOpen(false);
        fetchData();
      } else {
        alert(data.error || `Server error: ${res.statusText}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Network error connecting to backend.");
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleDirectCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineInput.trim()) return;

    if (!currentOrgId) {
      alert("Organization identifier is missing. Please re-login.");
      return;
    }

    setIsSavingMachine(true);
    try {
      const res = await fetch(`${API_URL}/api/machine-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: currentOrgId,
          organizationId: currentOrgId,
          name: newMachineInput.trim(),
          role: user?.role || "ADMIN",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMachineUnits((prev) => [...prev, data]);
        setNewMachineInput("");
        setIsAddMachineModalOpen(false);
        fetchData();
      } else {
        alert(data.error || `Server error: ${res.statusText}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Network error connecting to backend.");
    } finally {
      setIsSavingMachine(false);
    }
  };

  const handleUpdateCategoryName = async (id: string) => {
    if (!editingCatName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/equipment-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingCatName.trim(), role: user?.role || "ADMIN" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCustomCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
        setEditingCatId(null);
        fetchData();
      } else {
        alert("Failed to update category name.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMachineName = async (id: string) => {
    if (!editingMachineName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/machine-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingMachineName.trim(), role: user?.role || "ADMIN" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMachineUnits((prev) => prev.map((m) => (m.id === id ? updated : m)));
        setEditingMachineId(null);
        fetchData();
      } else {
        alert("Failed to update machine unit name.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCategory = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/equipment-categories/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: user?.role }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCustomCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Permanently delete this category?")) return;
    try {
      const userRole = user?.role || "ADMIN";
      const res = await fetch(
        `${API_URL}/api/equipment-categories/${id}?role=${encodeURIComponent(userRole)}&orgId=${currentOrgId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(data.error || "Failed to delete category.");
      }
    } catch (err: any) {
      alert(err.message || "Network error deleting category.");
    }
  };

  const handleToggleMachine = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/machine-types/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: user?.role }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMachineUnits((prev) => prev.map((m) => (m.id === id ? updated : m)));
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (!window.confirm("Permanently delete this machine type?")) return;
    try {
      const userRole = user?.role || "ADMIN";
      const res = await fetch(
        `${API_URL}/api/machine-types/${id}?role=${encodeURIComponent(userRole)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMachineUnits((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(data.error || "Failed to delete machine unit.");
      }
    } catch (err: any) {
      alert(err.message || "Network error deleting machine unit.");
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

  // --- FILTERING LOGIC FOR ASSETS ---
  const filteredAssets = assets.filter((asset) => {
    let matches = true;

    if (statusFilter === "OPERATIONAL" || statusFilter === "DAMAGED") {
      matches = matches && asset.status === statusFilter;
    }

    if (locationFilter !== "ALL") {
      const assetLoc = (asset.locationName || asset.location || asset.siteLocation || "").trim();
      matches = matches && assetLoc.toLowerCase() === locationFilter.trim().toLowerCase();
    }

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
                            value={editForm.locationName || editForm.location || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                locationName: e.target.value,
                                location: e.target.value,
                              })
                            }
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                          >
                            <option value="">Select location...</option>
                            {availableLocations.map((locName) => (
                              <option key={locName} value={locName}>
                                {locName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-500">
                            {selectedAsset.locationName || selectedAsset.location || "—"}
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
                          {selectedAsset.locationName || selectedAsset.location || "—"}
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

                  <button
                    onClick={() => setStatusFilter("HARDWARE_TEMPLATES")}
                    className={`pb-3 relative transition-colors whitespace-nowrap ${statusFilter === "HARDWARE_TEMPLATES" ? "text-amber-600" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Hardware Presets & Templates
                    {statusFilter === "HARDWARE_TEMPLATES" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full"></div>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Unified Create Button: Always opens CreateAssetModal unless a Tracker sub-modal is active */}
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
          {statusFilter !== "HARDWARE_TEMPLATES" && (
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

                {/* LOCATION FILTER - DYNAMIC DROPDOWN */}
                {(statusFilter === "ALL" ||
                  statusFilter === "OPERATIONAL" ||
                  statusFilter === "DAMAGED") && (
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm cursor-pointer"
                  >
                    <option value="ALL">All Locations</option>
                    {availableLocations.map((locName: string) => (
                      <option key={locName} value={locName}>
                        {locName}
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
          )}

          <div className="flex-1 overflow-auto p-4 md:p-0 bg-gray-50/30">
            {/* --- HARDWARE PRESETS & TEMPLATES EDITING VIEW --- */}
            {statusFilter === "HARDWARE_TEMPLATES" && isFullAccess ? (
              <div className="p-6 md:p-8 space-y-8 bg-white">
                {/* Custom Sub-Categories Section */}
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900">Equipment Sub-Categories</h3>
                      <p className="text-xs text-gray-500">
                        Add, edit name, discontinue, or delete sub-categories for asset creation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddCatModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3.5 text-left">Category Name</th>
                          <th className="px-6 py-3.5 text-left">Key Identifier</th>
                          <th className="px-6 py-3.5 text-left">Status</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white text-xs">
                        {customCategories.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">
                              No custom categories registered yet. Click <b>+ Add Category</b> to create one.
                            </td>
                          </tr>
                        ) : (
                          customCategories.map((cat: any) => (
                            <tr key={cat.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-bold text-gray-900">
                                {editingCatId === cat.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingCatName}
                                      onChange={(e) => setEditingCatName(e.target.value)}
                                      className="px-3 py-1 border border-blue-500 rounded-lg text-xs font-bold outline-none"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleUpdateCategoryName(cat.id)}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingCatId(null)}
                                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span>{cat.name}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-mono text-gray-500">{cat.key}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    cat.isActive
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : "bg-gray-100 text-gray-500 border border-gray-200"
                                  }`}
                                >
                                  {cat.isActive ? "Active in Modal" : "Discontinued (Hidden)"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                {editingCatId !== cat.id && (
                                  <button
                                    onClick={() => {
                                      setEditingCatId(cat.id);
                                      setEditingCatName(cat.name);
                                    }}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-[11px] transition-colors"
                                  >
                                    Edit Name
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleCategory(cat.id)}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors ${
                                    cat.isActive
                                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  }`}
                                >
                                  {cat.isActive ? "Discontinue" : "Reactivate"}
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Permanently"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Machine Simulator Units Section */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900">Machine Simulator Units</h3>
                      <p className="text-xs text-gray-500">
                        Add, edit name, discontinue, or delete machine units for asset creation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddMachineModalOpen(true)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add Machine Unit
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3.5 text-left">Machine Unit Name</th>
                          <th className="px-6 py-3.5 text-left">Status</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white text-xs">
                        {machineUnits.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-gray-400 font-medium">
                              No custom machine units saved. Click <b>+ Add Machine Unit</b> to create one.
                            </td>
                          </tr>
                        ) : (
                          machineUnits.map((m: any) => (
                            <tr key={m.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-bold text-gray-900">
                                {editingMachineId === m.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingMachineName}
                                      onChange={(e) => setEditingMachineName(e.target.value)}
                                      className="px-3 py-1 border border-orange-500 rounded-lg text-xs font-bold outline-none"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleUpdateMachineName(m.id)}
                                      className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingMachineId(null)}
                                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span>{m.name} Unit</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    m.isActive
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : "bg-gray-100 text-gray-500 border border-gray-200"
                                  }`}
                                >
                                  {m.isActive ? "Active in Modal" : "Discontinued (Hidden)"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                {editingMachineId !== m.id && (
                                  <button
                                    onClick={() => {
                                      setEditingMachineId(m.id);
                                      setEditingMachineName(m.name);
                                    }}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-[11px] transition-colors"
                                  >
                                    Edit Name
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleMachine(m.id)}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors ${
                                    m.isActive
                                      ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                                      : "bg-green-50 text-green-800 hover:bg-green-100"
                                  }`}
                                >
                                  {m.isActive ? "Discontinue" : "Reactivate"}
                                </button>
                                <button
                                  onClick={() => handleDeleteMachine(m.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : /* --- PC S/N TRACKER VIEW --- */
            statusFilter === "PC_TRACKER" && isFullAccess ? (
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
                          <span className="truncate">
                            Location: {asset.locationName || asset.location || "—"}
                          </span>
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
                          {asset.locationName || asset.location || "—"}
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

      {/* QUICK MODAL: ADD CATEGORY */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-black text-gray-900">Add Equipment Sub-Category</h4>
              <button
                onClick={() => {
                  setIsAddCatModalOpen(false);
                  setNewCatInput("");
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDirectCreateCategory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Enter equipment category name..."
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCatModalOpen(false);
                    setNewCatInput("");
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCat || !newCatInput.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 shadow-sm"
                >
                  {isSavingCat ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MODAL: ADD MACHINE UNIT */}
      {isAddMachineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-black text-gray-900">Add Machine Simulator Unit</h4>
              <button
                onClick={() => {
                  setIsAddMachineModalOpen(false);
                  setNewMachineInput("");
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDirectCreateMachine} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1.5">
                  Machine Unit Code
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Enter simulator unit code..."
                  value={newMachineInput}
                  onChange={(e) => setNewMachineInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMachineModalOpen(false);
                    setNewMachineInput("");
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMachine || !newMachineInput.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl disabled:opacity-50 shadow-sm"
                >
                  {isSavingMachine ? "Saving..." : "Create Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Assets;