/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Inbox,
  Box,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Tag,
  Barcode,
  Camera,
  DollarSign,
  X,
  Trash2,
  UploadCloud,
  Bug,
} from "lucide-react";

const getStockStatusColor = (status: any, qty: number, minQty: number) => {
  if (status === "OUT_OF_STOCK" || qty === 0)
    return "bg-red-50 text-red-700 ring-1 ring-red-600/20";
  if (qty <= minQty)
    return "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20";
  return "bg-green-50 text-green-700 ring-1 ring-green-600/20";
};

const PartsInventory = ({ user }: any) => {
  const [parts, setParts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Debug States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any | null>(null);
  const [debugMode, setDebugMode] = useState(false); // Diagnostic Tool

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [partsRes, locRes] = await Promise.all([
        fetch(
          `http://localhost:8080/api/inventory?orgId=${user?.organizationId}`,
        ),
        fetch(
          `http://localhost:8080/api/locations?orgId=${user?.organizationId}`,
        ),
      ]);

      if (partsRes.ok) setParts(await partsRes.json());
      if (locRes.ok) setLocations(await locRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organizationId) fetchData();
  }, [user]);

  //  ACCESS CONTROL LOGIC
  const globalLocations = [
    "Pulseworks Shop",
    "Pulseworks Warehouse",
    "Global",
    "",
  ];

  const filteredParts = parts.filter((part) => {
    // 1. DEBUG MODE: Show everything if debug toggle is on
    if (debugMode) return true;

    // 2. STRICT ADMIN OVERRIDE: Only true organization admins see everything globally
    if (user?.role === "ADMIN") return true;

    // 3. LOCATION & GLOBAL ACCESS: Standard users see their exact site location AND global locations
    const partLocation = part.siteLocation || part.location || "";
    const matchesUserSite = partLocation === user?.siteLocation;
    const matchesGlobal = globalLocations.includes(partLocation);

    const matchesLocation = matchesUserSite || matchesGlobal;

    // 4. SEARCH QUERY FILTER
    const matchesSearch = searchQuery
      ? part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.partNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesLocation && matchesSearch;
  });

  const thClass =
    "px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] border-b border-gray-100 bg-white/50 whitespace-nowrap";
  const tdClass =
    "px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-700";

  return (
    <main className="flex-1 flex flex-col h-full bg-[#fafafa] p-6 sm:p-10 overflow-hidden">
      {/* MISSING LOCATION WARNING */}
      {!user?.siteLocation && user?.role !== "ADMIN" && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-[14px] font-bold flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <p>WARNING: Your user profile is missing a Site Location!</p>
            <p className="text-[12px] font-medium mt-0.5">
              The frontend does not know where you are stationed. Check your
              backend login/auth API to ensure 'siteLocation' is being included
              in the response.
            </p>
          </div>
        </div>
      )}

      {/* DEBUG DIAGNOSTICS VIEW */}
      {debugMode && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-xl mb-6 text-xs font-mono whitespace-pre-wrap shadow-lg">
          === DIAGNOSTIC X-RAY ===
          <br />• User ID: {user?.id || "N/A"}
          <br />• User Role: {user?.role || "N/A"}
          <br />• User Location: "{user?.siteLocation || "UNDEFINED"}"<br />•
          Total Parts Fetched From API: {parts.length}
          <br />• Parts Matching Filter: {filteredParts.length}
        </div>
      )}

      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <div className="flex items-center text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            <span>Procurement</span>
            <span className="mx-2">/</span>
            <span className="text-blue-600">Parts Inventory</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">
            Parts & Inventory
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* DEBUG TOGGLE BUTTON */}
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-4 py-2.5 rounded-xl text-[14px] font-bold transition-all flex items-center gap-2 ${debugMode ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
          >
            <Bug className="w-4 h-4" /> {debugMode ? "Debug: ON" : "Debug: OFF"}
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Create Part
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-t-2xl border border-gray-200/80 border-b-0 flex gap-4 items-center shadow-[0_8px_30px_rgb(0,0,0,0.02)] shrink-0">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-[11px]" />
          <input
            type="text"
            placeholder="Search by part name or part number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200/80 rounded-xl text-[14px] font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-[4px] focus:ring-blue-500/15 focus:border-blue-500 transition-all duration-200"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/50 border border-gray-200/80 rounded-xl text-[14px] font-bold text-gray-600 hover:bg-gray-100 transition-colors">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-b-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col relative">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="min-w-full divide-y divide-gray-100 relative">
            <thead className="sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th
                  className={`${thClass} sticky left-0 z-20 bg-white/90 shadow-[1px_0_0_0_#f3f4f6]`}
                >
                  Image / Name
                </th>
                <th className={thClass}>Part Number</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Available QTY</th>
                <th className={thClass}>On Hand QTY</th>
                <th className={thClass}>Allocated QTY</th>
                <th className={thClass}>Incoming</th>
                <th className={thClass}>Site Location</th>
                <th className={thClass}>Area</th>
                <th className={thClass}>Date Created</th>
                <th className={thClass}>Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/80 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[13px] font-medium text-gray-500">
                        Loading inventory...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        <Box className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-[15px] font-bold text-gray-900">
                        No parts found
                      </p>
                      <p className="text-[13px] text-gray-500 mt-1">
                        {user?.role === "ADMIN"
                          ? "Create a new part to start building your inventory."
                          : "No inventory items are currently assigned to your site location or global inventory."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => (
                  <tr
                    key={part.id}
                    onClick={() => setSelectedPart(part)}
                    className="hover:bg-blue-50/50 transition-colors duration-200 group cursor-pointer"
                  >
                    <td
                      className={`${tdClass} sticky left-0 z-10 bg-white group-hover:bg-blue-50/50 shadow-[1px_0_0_0_#f3f4f6] transition-colors flex items-center gap-3`}
                    >
                      <div className="relative w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                        {part.imageUrls && part.imageUrls.length > 0 ? (
                          <>
                            <img
                              src={part.imageUrls[0]}
                              alt={part.name}
                              className="w-full h-full object-cover"
                            />
                            {part.imageUrls.length > 1 && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold backdrop-blur-[1px]">
                                +{part.imageUrls.length - 1}
                              </div>
                            )}
                          </>
                        ) : (
                          <Camera className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <span className="font-bold text-gray-900">
                        {part.name}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span className="font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md text-xs">
                        {part.partNumber || "N/A"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${getStockStatusColor(part.status, part.availableQty, part.minQty)}`}
                      >
                        {part.availableQty > 0 ? "IN STOCK" : "OUT OF STOCK"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      {part.category || "Uncategorized"}
                    </td>
                    <td className={tdClass}>
                      <span className="font-bold text-gray-900">
                        {part.availableQty || 0}
                      </span>
                    </td>
                    <td className={tdClass}>{part.onHandQty || 0}</td>
                    <td className={tdClass}>{part.allocatedQty || 0}</td>
                    <td className={tdClass}>{part.incomingQty || 0}</td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />{" "}
                        {part.siteLocation || "Global"}
                      </div>
                    </td>
                    <td className={tdClass}>{part.area || "—"}</td>
                    <td className={tdClass}>
                      {new Date(
                        part.createdAt || Date.now(),
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-gray-500 max-w-[200px] truncate">
                      {part.description || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreatePartModal
          user={user}
          locations={locations}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            setIsCreateModalOpen(false);
            fetchData();
          }}
        />
      )}

      {selectedPart && (
        <EditPartModal
          user={user}
          part={selectedPart}
          locations={locations}
          onClose={() => setSelectedPart(null)}
          onUpdated={() => {
            setSelectedPart(null);
            fetchData();
          }}
          onDeleted={() => {
            setSelectedPart(null);
            fetchData();
          }}
        />
      )}
    </main>
  );
};

// CREATE PART MODAL
const CreatePartModal = ({ user, locations, onClose, onCreated }: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic Info State
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [cost, setCost] = useState("");
  const [barcode, setBarcode] = useState("");
  const [tags, setTags] = useState("");

  // Inventory & Location State
  const [isNonStock, setIsNonStock] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [availableQty, setAvailableQty] = useState("");
  const [minQty, setMinQty] = useState("");
  const [maxQtyThreshold, setMaxQtyThreshold] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [area, setArea] = useState("");

  const handleImageUpload = (e: any) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file as Blob);
        });
      }),
    ).then((newBase64Images) => {
      setImageUrls((prev) => [...prev, ...newBase64Images]);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const generateBarcode = () => {
    setBarcode(`KODA-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return alert("Part Name is required!");
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        partNumber,
        description,
        category,
        cost: parseFloat(cost) || 0,
        barcode,
        tags,
        imageUrls,
        isNonStock,
        isCritical,
        availableQty: parseInt(availableQty) || 0,
        minQty: parseInt(minQty) || 0,
        maxQtyThreshold: parseInt(maxQtyThreshold) || 0,
        siteLocation,
        area,
        organizationId: user.organizationId,
      };

      const response = await fetch("http://localhost:8080/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) onCreated();
      else {
        const errData = await response.json();
        alert(`Failed to save part: ${errData.error || "Server error"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Server error while saving part.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-4 py-3 text-[14px] font-medium text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-[4px] focus:ring-blue-500/15 focus:border-blue-500 transition-all duration-200 shadow-sm";
  const labelClass =
    "block text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[900px] rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-10 sticky top-0">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-gray-900">
              Create New Part
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-5">
              <Box className="w-5 h-5 text-blue-600" /> Basic Information
            </h3>

            <div className="mb-8">
              <label className={labelClass}>Part Images</label>
              <div className="flex flex-wrap gap-4">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 rounded-2xl border border-gray-200 overflow-hidden group shadow-sm"
                  >
                    <img
                      src={url}
                      alt={`Preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="relative group cursor-pointer shrink-0">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group-hover:border-blue-500 group-hover:bg-blue-50/50 transition-colors">
                    <UploadCloud className="w-6 h-6 text-gray-400 mb-1.5 group-hover:text-blue-500" />
                    <span className="text-[10px] font-bold text-gray-500 text-center px-1">
                      Add Images
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>
                    Part Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Part Number</label>
                  <input
                    type="text"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cost</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-[13px] w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Barcode / QR Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={generateBarcode}
                      type="button"
                      className="px-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-gray-600 transition-colors"
                    >
                      <Barcode className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label className={labelClass}>Tags</label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-[13px] w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-blue-600" /> Inventory & Location
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-6">
              <div className="flex gap-6 pb-6 border-b border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isNonStock}
                      onChange={(e) => setIsNonStock(e.target.checked)}
                      className="peer w-5 h-5 opacity-0 absolute"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-[6px] peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                    Non-stock Part
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isCritical}
                      onChange={(e) => setIsCritical(e.target.checked)}
                      className="peer w-5 h-5 opacity-0 absolute"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-[6px] peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-colors flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                    Critical Part
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Available Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={availableQty}
                    onChange={(e) => setAvailableQty(e.target.value)}
                    className={inputClass}
                    disabled={isNonStock}
                  />
                </div>
                <div>
                  <label className={labelClass}>Min QTY Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                    className={inputClass}
                    disabled={isNonStock}
                  />
                </div>
                <div>
                  <label className={labelClass}>Max QTY Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={maxQtyThreshold}
                    onChange={(e) => setMaxQtyThreshold(e.target.value)}
                    className={inputClass}
                    disabled={isNonStock}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Site Location</label>
                  <select
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="">Select a location...</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Area / Bin / Shelf</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-8 py-5 bg-gray-50/80 border-t border-gray-100 gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 rounded-xl transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            type="button"
            className="px-8 py-2.5 text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Save Part"}
          </button>
        </div>
      </div>
    </div>
  );
};

//  EDIT PART MODAL
const EditPartModal = ({
  user,
  part,
  locations,
  onClose,
  onUpdated,
  onDeleted,
}: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [imageUrls, setImageUrls] = useState<string[]>(part.imageUrls || []);
  const [name, setName] = useState(part.name || "");
  const [partNumber, setPartNumber] = useState(part.partNumber || "");
  const [description, setDescription] = useState(part.description || "");
  const [category, setCategory] = useState(part.category || "");
  const [cost, setCost] = useState(part.cost || "");
  const [barcode, setBarcode] = useState(part.barcode || "");
  const [tags, setTags] = useState(part.tags || "");

  const [isNonStock, setIsNonStock] = useState(part.isNonStock || false);
  const [isCritical, setIsCritical] = useState(part.isCritical || false);
  const [availableQty, setAvailableQty] = useState(part.availableQty || "");
  const [minQty, setMinQty] = useState(part.minQty || "");
  const [maxQtyThreshold, setMaxQtyThreshold] = useState(
    part.maxQtyThreshold || "",
  );
  const [siteLocation, setSiteLocation] = useState(part.siteLocation || "");
  const [area, setArea] = useState(part.area || "");

  const handleImageUpload = (e: any) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file as Blob);
        });
      }),
    ).then((newBase64Images) => {
      setImageUrls((prev) => [...prev, ...newBase64Images]);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdate = async () => {
    if (!name.trim()) return alert("Part Name is required!");
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        partNumber,
        description,
        category,
        cost: parseFloat(cost) || 0,
        barcode,
        tags,
        imageUrls,
        isNonStock,
        isCritical,
        availableQty: parseInt(availableQty) || 0,
        minQty: parseInt(minQty) || 0,
        maxQtyThreshold: parseInt(maxQtyThreshold) || 0,
        siteLocation,
        area,
      };

      const response = await fetch(
        `http://localhost:8080/api/inventory/${part.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) onUpdated();
      else alert("Failed to update part.");
    } catch (error) {
      console.error(error);
      alert("Server error while updating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm("Are you sure you want to permanently delete this part?")
    )
      return;
    setIsDeleting(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/inventory/${part.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) onDeleted();
      else alert("Failed to delete part.");
    } catch (error) {
      console.error(error);
      alert("Server error while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass =
    "w-full bg-gray-50/50 border border-gray-200/80 rounded-xl px-4 py-3 text-[14px] font-medium text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-[4px] focus:ring-blue-500/15 focus:border-blue-500 transition-all duration-200 shadow-sm";
  const labelClass =
    "block text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[900px] rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-10 sticky top-0">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-gray-900">
              Edit Part
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-5">
              <Box className="w-5 h-5 text-blue-600" /> Basic Information
            </h3>

            <div className="mb-8">
              <label className={labelClass}>Part Images</label>
              <div className="flex flex-wrap gap-4">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 rounded-2xl border border-gray-200 overflow-hidden group shadow-sm"
                  >
                    <img
                      src={url}
                      alt={`Preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="relative group cursor-pointer shrink-0">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group-hover:border-blue-500 group-hover:bg-blue-50/50 transition-colors">
                    <UploadCloud className="w-6 h-6 text-gray-400 mb-1.5 group-hover:text-blue-500" />
                    <span className="text-[10px] font-bold text-gray-500 text-center px-1">
                      Add Images
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>
                    Part Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Part Number</label>
                  <input
                    type="text"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cost</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-[13px] w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Barcode / QR Code</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label className={labelClass}>Tags</label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-[13px] w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-blue-600" /> Inventory & Location
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-6">
              <div className="flex gap-6 pb-6 border-b border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isNonStock}
                      onChange={(e) => setIsNonStock(e.target.checked)}
                      className="peer w-5 h-5 opacity-0 absolute"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-[6px] peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                    Non-stock Part
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isCritical}
                      onChange={(e) => setIsCritical(e.target.checked)}
                      className="peer w-5 h-5 opacity-0 absolute"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-[6px] peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-colors flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                    Critical Part
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Available Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={availableQty}
                    onChange={(e) => setAvailableQty(e.target.value)}
                    className={inputClass}
                    disabled={isNonStock}
                  />
                </div>
                <div>
                  <label className={labelClass}>Min QTY Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                    className={inputClass}
                    disabled={isNonStock}
                  />
                </div>
                <div>
                  <label className={labelClass}>Max QTY Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={maxQtyThreshold}
                    onChange={(e) => setMaxQtyThreshold(e.target.value)}
                    className={inputClass}
                    disabled={isNonStock}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Site Location</label>
                  <select
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="">Select a location...</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Area / Bin / Shelf</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-5 bg-gray-50/80 border-t border-gray-100 gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            type="button"
            className="px-5 py-2.5 text-[14px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />{" "}
            {isDeleting ? "Deleting..." : "Delete Part"}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={isSubmitting}
              type="button"
              className="px-8 py-2.5 text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Part"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartsInventory;
