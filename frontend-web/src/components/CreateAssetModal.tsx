/* eslint-disable no-useless-assignment */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  X,
  Box,
  MapPin,
  FileText,
  Barcode,
  Hash,
  Settings,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Monitor,
  Headset,
  Cpu,
  Network,
  Sparkles,
  Plus,
  Layers,
  Eye,
} from "lucide-react";

const CATEGORIES = ["ASSETS", "LARGE_DAMAGE"];
const API_URL = import.meta.env.VITE_API_URL;

const DEFAULT_SUB_CATEGORIES = [
  { key: "PC", label: "PC / Computer", icon: Monitor },
  { key: "HEADSET", label: "VR Headset", icon: Headset },
  { key: "MACHINE", label: "Machine / Motion", icon: Cpu },
  { key: "MAT_VR", label: "Mat VR", icon: Eye },
  { key: "VR_ARENA", label: "VR Arena", icon: Layers },
  { key: "GENERAL", label: "General Asset", icon: Box },
];

const DEFAULT_MACHINE_TYPES = [
  { id: "m-4dx", name: "4DX" },
  { id: "m-dito", name: "DITO" },
  { id: "m-vrt", name: "VRT" },
  { id: "m-psb", name: "PSB" },
  { id: "m-mx4d", name: "MX4D" },
];

const CreateAssetModal = ({
  isOpen,
  onClose,
  user,
  onCreated,
  pcTracker = [],
  headsetTracker = [],
  vrConfigs = [],
  onTrackerUpdate,
}: any) => {
  const [locations, setLocations] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Sub-Categories State
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Dynamic Machine Simulator Unit State
  const [customMachineTypes, setCustomMachineTypes] = useState<any[]>([]);
  const [isAddingMachineType, setIsAddingMachineType] = useState(false);
  const [newMachineTypeName, setNewMachineTypeName] = useState("");
  const [isSavingMachineType, setIsSavingMachineType] = useState(false);

  // Sub-Category Selection
  const [assetSubtype, setAssetSubtype] = useState<string>("PC");

  // Specific Sub-type fields
  const [selectedPcType, setSelectedPcType] = useState("");
  const [selectedHeadsetModel, setSelectedHeadsetModel] = useState("");
  const [selectedMachineType, setSelectedMachineType] = useState("4DX");
  const [serverIp, setServerIp] = useState("");

  // Dedicated VR Preset state
  const [vrPresetSite, setVrPresetSite] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    model: "",
    serialNumber: "",
    barcode: "",
    category: "ASSETS",
    locationName: "",
    status: "OPERATIONAL",
    uptime: "100%",
    downtime: "0 hrs",
    reliabilityScore: "A+",
  });

  const isAdmin = user?.role === "ADMIN";
  const currentOrgId = user?.organizationId || user?.orgId || user?.organization_id;

  // Fetch only active custom categories & machine types from DB
  const fetchCustomData = async () => {
    if (!currentOrgId) return;
    try {
      const [catRes, machRes] = await Promise.all([
        fetch(`${API_URL}/api/equipment-categories?orgId=${currentOrgId}&activeOnly=true`),
        fetch(`${API_URL}/api/machine-types?orgId=${currentOrgId}&activeOnly=true`),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        const activeOnly = Array.isArray(catData)
          ? catData.filter((c: any) => c.isActive !== false)
          : [];
        setCustomCategories(activeOnly);
      }

      if (machRes.ok) {
        const machData = await machRes.json();
        const activeMachines = Array.isArray(machData)
          ? machData.filter((m: any) => m.isActive !== false)
          : [];
        setCustomMachineTypes(activeMachines);
      }
    } catch (err) {
      console.error("Failed to load asset templates:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomData();
    }
  }, [isOpen, currentOrgId]);

  const allSubCategories = [
    ...DEFAULT_SUB_CATEGORIES,
    ...customCategories.map((c) => ({
      key: c.key,
      label: c.name,
      icon: Box,
    })),
  ];

  const allMachineUnits = [...DEFAULT_MACHINE_TYPES, ...customMachineTypes];

  // Handle Admin creating a new sub-category directly from modal
  const handleCreateNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !currentOrgId) return;

    setIsSavingCategory(true);
    try {
      const res = await fetch(`${API_URL}/api/equipment-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: currentOrgId,
          name: newCategoryName.trim(),
          role: user?.role || "ADMIN",
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCustomCategories((prev) => [...prev, created]);
        setAssetSubtype(created.key);
        setNewCategoryName("");
        setIsAddingCategory(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to create equipment category");
      }
    } catch (err) {
      console.error(err);
      alert("Network error creating category");
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Handle Admin creating a new Machine Simulator Unit directly from modal
  const handleCreateNewMachineType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineTypeName.trim() || !currentOrgId) return;

    setIsSavingMachineType(true);
    try {
      const res = await fetch(`${API_URL}/api/machine-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: currentOrgId,
          name: newMachineTypeName.trim(),
          role: user?.role || "ADMIN",
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCustomMachineTypes((prev) => [...prev, created]);
        setSelectedMachineType(created.name);
        setNewMachineTypeName("");
        setIsAddingMachineType(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to create machine unit");
      }
    } catch (err) {
      console.error(err);
      alert("Network error creating machine unit");
    } finally {
      setIsSavingMachineType(false);
    }
  };

  useEffect(() => {
    if (pcTracker.length > 0 && !selectedPcType) setSelectedPcType(pcTracker[0].label);
    if (headsetTracker.length > 0 && !selectedHeadsetModel)
      setSelectedHeadsetModel(headsetTracker[0].label);
  }, [pcTracker, headsetTracker]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (isOpen && currentOrgId) {
        try {
          const res = await fetch(`${API_URL}/api/locations?orgId=${currentOrgId}`);
          if (res.ok) {
            const locData = await res.json();
            const locationNames = locData.map((l: any) => l.name);
            setLocations(locationNames.sort());
          }
        } catch (err) {
          console.error("Failed to load locations:", err);
        }
      }
    };
    fetchLocations();
  }, [isOpen, currentOrgId]);

  const generateNextAssetDetails = (trackerObj: any) => {
    if (!trackerObj) return { serial: "", name: "" };

    let nextSerial = trackerObj.prefix || "";

    if (trackerObj.lastUsed) {
      const match = trackerObj.lastUsed.match(/(\d+)$/);
      if (match) {
        const numStr = match[1];
        const nextNum = parseInt(numStr, 10) + 1;
        const paddedNum = nextNum.toString().padStart(numStr.length, "0");
        nextSerial = trackerObj.lastUsed.replace(/\d+$/, paddedNum);
      } else {
        nextSerial = trackerObj.lastUsed + "-1";
      }
    } else {
      nextSerial += "001";
    }

    const format = trackerObj.assetName || trackerObj.brand || trackerObj.model || "";
    let finalName = "";

    if (format.includes("###")) {
      const numMatch = nextSerial.match(/(\d+)$/);
      const nums = numMatch ? numMatch[1] : "001";
      finalName = format.replace("###", nums);
    } else {
      finalName = `${format} ${nextSerial}`.trim();
    }

    return { serial: nextSerial, name: finalName };
  };

  useEffect(() => {
    if (assetSubtype === "PC") {
      const pcObj = pcTracker.find((p: any) => p.label === selectedPcType) || pcTracker[0];
      if (pcObj) {
        const { serial, name } = generateNextAssetDetails(pcObj);
        setFormData((prev) => ({
          ...prev,
          model: pcObj.brand,
          serialNumber: serial,
          name: name,
        }));
      }
    } else if (assetSubtype === "HEADSET") {
      const hObj =
        headsetTracker.find((h: any) => h.label === selectedHeadsetModel) || headsetTracker[0];
      if (hObj) {
        const { serial, name } = generateNextAssetDetails(hObj);
        setFormData((prev) => ({
          ...prev,
          model: hObj.model,
          serialNumber: serial,
          name: name,
        }));
      }
    } else if (assetSubtype === "MACHINE") {
      setFormData((prev) => ({
        ...prev,
        model: `${selectedMachineType} Simulator Unit`,
        name: `${selectedMachineType} Motion Base`,
        serialNumber: "",
      }));
    } else {
      const customMatch = customCategories.find((c) => c.key === assetSubtype);
      setFormData((prev) => ({
        ...prev,
        model: customMatch ? customMatch.name : "",
        name: customMatch ? `${customMatch.name} Unit` : "",
        serialNumber: "",
      }));
    }
  }, [
    assetSubtype,
    selectedPcType,
    selectedHeadsetModel,
    selectedMachineType,
    pcTracker,
    headsetTracker,
    customCategories,
  ]);

  const currentSiteConfig = vrPresetSite
    ? vrConfigs.find((c: any) => c.site === vrPresetSite)
    : null;

  const applySitePreset = () => {
    if (!currentSiteConfig) return;
    setServerIp(currentSiteConfig.serverIp);
    setFormData((prev) => ({
      ...prev,
      description: `Target Deployment: ${vrPresetSite}\nVR Configuration: ${currentSiteConfig.machine} Motion Unit | Headset: ${currentSiteConfig.headset} | PC: ${currentSiteConfig.pc} | Server IP: ${currentSiteConfig.serverIp} | Dual Eth: ${currentSiteConfig.dualEth}${currentSiteConfig.notes ? ` (${currentSiteConfig.notes})` : ""}`,
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Asset name is required.");
    if (!formData.locationName) return alert("Origin location is required.");

    setIsSubmitting(true);
    try {
      let finalDescription = formData.description;
      if (serverIp && !finalDescription.includes("Server IP:")) {
        finalDescription = `${finalDescription ? `${finalDescription}\n` : ""}Server IP: ${serverIp}`;
      }

      const payload = {
        name: formData.name,
        description: finalDescription || null,
        model: formData.model || null,
        serialNumber: formData.serialNumber || null,
        barcode: formData.barcode || null,
        category: formData.category || "ASSETS",
        subCategory: assetSubtype,
        locationName: formData.locationName || null,
        status: formData.status,
        uptime: formData.uptime || "100%",
        downtime: formData.downtime || "0 hrs",
        reliabilityScore: formData.reliabilityScore || "A+",
        organizationId: currentOrgId,
      };

      const res = await fetch(`${API_URL}/api/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (assetSubtype === "PC") {
          const pcObj = pcTracker.find((p: any) => p.label === selectedPcType);
          if (pcObj && formData.serialNumber) {
            onTrackerUpdate("PC", pcObj.id, formData.serialNumber);
          }
        } else if (assetSubtype === "HEADSET") {
          const hObj = headsetTracker.find((h: any) => h.label === selectedHeadsetModel);
          if (hObj && formData.serialNumber) {
            onTrackerUpdate("HEADSET", hObj.id, formData.serialNumber);
          }
        }

        setFormData({
          name: "",
          description: "",
          model: "",
          serialNumber: "",
          barcode: "",
          category: "ASSETS",
          locationName: "",
          status: "OPERATIONAL",
          uptime: "100%",
          downtime: "0 hrs",
          reliabilityScore: "A+",
        });
        setServerIp("");
        setVrPresetSite("");
        setIsAddingCategory(false);
        setNewCategoryName("");
        setIsAddingMachineType(false);
        setNewMachineTypeName("");
        onCreated();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to create asset: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Server error connecting to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm text-gray-900";
  const labelClasses =
    "block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5";

  const activePCObj = pcTracker.find((p: any) => p.label === selectedPcType);
  const activeHeadsetObj = headsetTracker.find((h: any) => h.label === selectedHeadsetModel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Box className="w-5 h-5" />
              </div>
              Create New Asset
            </h2>
            <p className="text-xs font-medium text-gray-500 mt-1">
              Register new hardware at the shop before deploying to a client site.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 sm:p-8 space-y-6 custom-scrollbar">
            {/* 1. ASSET SUB-TYPE SELECTOR TABS WITH DATABASE-DRIVEN ITEMS */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClasses}>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Select Equipment Sub-Category
                </label>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {allSubCategories.map((item) => {
                  const Icon = item.icon;
                  const isSelected = assetSubtype === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAssetSubtype(item.key)}
                      className={`min-w-[120px] flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-black text-xs transition-all border-2 ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-600 text-blue-900 shadow-sm"
                          : "bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}

                {/* ADMIN-ONLY "+ ADD ITEM" FOR CATEGORIES */}
                {isAdmin && !isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="min-w-[120px] flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-black text-xs border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/40 text-gray-500 hover:text-blue-600 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                )}
              </div>

              {/* INLINE ADMIN FORM TO SAVE NEW EQUIPMENT CATEGORY */}
              {isAdmin && isAddingCategory && (
                <div className="mt-3 p-3 bg-blue-50/50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center gap-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter new category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full sm:flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-blue-600"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleCreateNewCategory}
                      disabled={isSavingCategory || !newCategoryName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isSavingCategory ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName("");
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Subtype Specific Selector & Last S/N Reference Card */}
              {assetSubtype === "PC" && activePCObj && (
                <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-in fade-in duration-200">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                      PC Type & Style
                    </label>
                    <select
                      value={selectedPcType}
                      onChange={(e) => setSelectedPcType(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      {pcTracker.map((p: any) => (
                        <option key={p.id} value={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">
                      Last PC S/N Used
                    </span>
                    <span className="text-sm font-black font-mono text-blue-950">
                      {activePCObj.lastUsed}
                    </span>
                  </div>
                </div>
              )}

              {assetSubtype === "HEADSET" && activeHeadsetObj && (
                <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-in fade-in duration-200">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                      Headset Model
                    </label>
                    <select
                      value={selectedHeadsetModel}
                      onChange={(e) => setSelectedHeadsetModel(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      {headsetTracker.map((h: any) => (
                        <option key={h.id} value={h.label}>
                          {h.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl px-3.5 py-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 block">
                      Last Headset S/N Used
                    </span>
                    <span className="text-sm font-black font-mono text-purple-950">
                      {activeHeadsetObj.lastUsed}
                    </span>
                  </div>
                </div>
              )}

              {/* MACHINE SIMULATOR UNIT WITH BASELINE + DYNAMIC DATABASE ITEMS */}
              {assetSubtype === "MACHINE" && (
                <div className="pt-3 border-t border-gray-100 flex flex-col gap-3 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Machine Simulator Unit
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allMachineUnits.map((m: any) => (
                      <button
                        key={m.id || m.name}
                        type="button"
                        onClick={() => setSelectedMachineType(m.name)}
                        className={`px-4 py-2 rounded-lg font-black text-xs border transition-all ${
                          selectedMachineType === m.name
                            ? "bg-orange-500 text-white border-orange-600 shadow-sm"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {m.name} Unit
                      </button>
                    ))}

                    {/* ADMIN-ONLY "+ ADD MACHINE" BUTTON */}
                    {isAdmin && !isAddingMachineType && (
                      <button
                        type="button"
                        onClick={() => setIsAddingMachineType(true)}
                        className="px-3.5 py-2 rounded-lg font-black text-xs border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50/40 text-gray-500 hover:text-orange-600 flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Machine
                      </button>
                    )}
                  </div>

                  {/* INLINE ADMIN FORM FOR NEW MACHINE UNIT */}
                  {isAdmin && isAddingMachineType && (
                    <div className="mt-2 p-3 bg-orange-50/50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row items-center gap-2 animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Enter new machine unit name..."
                        value={newMachineTypeName}
                        onChange={(e) => setNewMachineTypeName(e.target.value)}
                        className="w-full sm:flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-orange-500"
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={handleCreateNewMachineType}
                          disabled={isSavingMachineType || !newMachineTypeName.trim()}
                          className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {isSavingMachineType ? "Saving..." : "Save Unit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingMachineType(false);
                            setNewMachineTypeName("");
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VR PRESET SELECTOR */}
              <div className="pt-4 border-t border-gray-100">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Auto-Fill Target Site Specs (Optional)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={vrPresetSite}
                    onChange={(e) => setVrPresetSite(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="">Select a destination site preset...</option>
                    {vrConfigs.map((config: any) => (
                      <option key={config.id} value={config.site}>
                        {config.site}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={applySitePreset}
                    disabled={!vrPresetSite}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    Apply Specs
                  </button>
                </div>
                {currentSiteConfig && (
                  <p className="text-[10px] text-blue-600 mt-2 font-medium">
                    <b>Preview:</b> Machine: {currentSiteConfig.machine} | Headset:{" "}
                    {currentSiteConfig.headset} | PC: {currentSiteConfig.pc} | IP:{" "}
                    {currentSiteConfig.serverIp}
                  </p>
                )}
              </div>
            </div>

            {/* 2. BASIC INFO */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <div>
                <label className={labelClasses}>
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. FANA-509 Galaxy or Origin PC"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClasses}
                />
                <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-wider">
                  This field is automatically pre-filled and formatted by your tracker settings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>
                    <MapPin className="w-3.5 h-3.5" /> Origin Location{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                    className={`${inputClasses} cursor-pointer font-bold text-blue-700`}
                  >
                    <option value="">Select origin...</option>
                    {locations.length > 0 ? (
                      locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Pulseworks Shop">Pulseworks Shop</option>
                        <option value="Pulseworks Warehouse">Pulseworks Warehouse</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Financial Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`${inputClasses} cursor-pointer font-bold`}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. IDENTIFIERS & HARDWARE STATUS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>
                    <Hash className="w-3.5 h-3.5" /> Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VC172, E4C154"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className={`${inputClasses} font-mono`}
                  />
                  <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-wider">
                    Auto-incremented from last use.
                  </p>
                </div>
                <div>
                  <label className={labelClasses}>
                    <Barcode className="w-3.5 h-3.5" /> Barcode / Asset Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BC-009"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className={`${inputClasses} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <Settings className="w-3.5 h-3.5" /> Model / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Origin v3 (Black PC)"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <Network className="w-3.5 h-3.5" /> Server IP Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10.0.0.99 or 192.168.1.99"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    className={`${inputClasses} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`${inputClasses} cursor-pointer font-bold ${formData.status === "OPERATIONAL" ? "text-green-700" : "text-red-700"}`}
                >
                  <option value="OPERATIONAL">🟢 Operational</option>
                  <option value="DAMAGED">🔴 Damaged</option>
                </select>
              </div>
            </div>

            {/* 4. METRICS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                Reliability, Uptime & Downtime Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClasses}>
                    <Clock className="w-3.5 h-3.5" /> Initial Uptime (%)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 99.8%"
                    value={formData.uptime}
                    onChange={(e) => setFormData({ ...formData, uptime: e.target.value })}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Initial Downtime
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.2 hrs"
                    value={formData.downtime}
                    onChange={(e) => setFormData({ ...formData, downtime: e.target.value })}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Reliability Score
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A+"
                    value={formData.reliabilityScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reliabilityScore: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>

            {/* 5. DESCRIPTION */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <label className={labelClasses}>
                <FileText className="w-3.5 h-3.5" /> Technical Notes & Specs
              </label>
              <textarea
                rows={3}
                placeholder="Add any technical specs, headset config, or machine notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputClasses} resize-y min-h-[90px]`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-8 py-5 bg-white border-t border-gray-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssetModal;