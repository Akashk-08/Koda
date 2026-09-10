/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Package,
  ScanLine,
  ArrowRightLeft,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  Box,
  X,
  Wrench,
  Search,
  Camera,
  MonitorCog,
  PenTool,
  Check,
  Globe,
  ChevronDown,
  ChevronUp,
  Cpu,
  Monitor,
  Headset,
  Layers,
  Settings,
  AlertCircle,
  Hash,
  QrCode,
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

const Inventory = ({ user }: any) => {
  const [loading, setLoading] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scannedAsset, setScannedAsset] = useState<any | null>(null);

  // View Toggle State
  const [inventoryTab, setInventoryTab] = useState<"LOCAL" | "DEPLOYED">("LOCAL");
  const [expandedSites, setExpandedSites] = useState<string[]>([]);
  const [expandedLocalCategories, setExpandedLocalCategories] = useState<string[]>([]);

  // Asset Suggestions State
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [assetSuggestions, setAssetSuggestions] = useState<any[]>([]);

  // General Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Specific action modes for the single modal
  const [actionType, setActionType] = useState<"IN" | "OUT" | "SOFTWARE" | "REPAIR">("IN");

  // Form States
  const [destination, setDestination] = useState("");
  const [comment, setComment] = useState("");

  // Camera Scanner State
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Scroll Container Ref
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  // Work Order & Location States
  const [allWorkOrders, setAllWorkOrders] = useState<any[]>([]);
  const [workOrderQuery, setWorkOrderQuery] = useState("");
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
  const [workOrderSuggestions, setWorkOrderSuggestions] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [markAsComplete, setMarkAsComplete] = useState(true);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Security & Access Control
  const allowedLocations = ["Pulseworks Shop", "Pulseworks Warehouse"];
  const isAuthorized =
    user?.role === "ADMIN" || allowedLocations.includes(user?.siteLocation || "");

  useEffect(() => {
    if (isAuthorized && scanInputRef.current && !isCameraScanning) {
      scanInputRef.current.focus();
    }
  }, [isAuthorized, isCameraScanning]);

  // Fetch Locations, Work Orders, and Assets ONCE when component mounts
  useEffect(() => {
    const fetchStaticData = async () => {
      if (!user?.organizationId) return;
      try {
        const [locRes, woRes, assetsRes] = await Promise.all([
          fetch(`http://${API_URL}/api/locations?orgId=${user.organizationId}`),
          fetch(`http://${API_URL}/api/workorders?orgId=${user.organizationId}`),
          fetch(`http://${API_URL}/api/assets?orgId=${user.organizationId}`),
        ]);

        if (locRes.ok) {
          setLocations(await locRes.json());
        }

        if (woRes.ok) {
          const woData = await woRes.json();
          setAllWorkOrders(Array.isArray(woData) ? woData : woData.data || woData.workOrders || []);
        }

        if (assetsRes.ok) {
          const astData = await assetsRes.json();
          setAllAssets(Array.isArray(astData) ? astData : astData.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch static data", err);
      }
    };
    fetchStaticData();
  }, [user?.organizationId]);

  // --- DYNAMIC LIVE INVENTORY BY SUB-CATEGORY (Local Shop/Warehouse) ---
  const localStockBySubCategory = useMemo(() => {
    if (!allAssets || allAssets.length === 0) return [];
    const relevantAssets = allAssets.filter((a) => allowedLocations.includes(a.locationName));

    const groups: Record<
      string,
      {
        subCategoryKey: string;
        displayName: string;
        totalCount: number;
        shopCount: number;
        warehouseCount: number;
        assets: any[];
        models: Record<string, number>;
      }
    > = {};

    const SUB_CATEGORY_LABELS: Record<string, string> = {
      HEADSET: "VR Headsets",
      PC: "PCs & Computers",
      MACHINE: "Simulators & Machines",
      MAT_VR: "Mat VR",
      VR_ARENA: "VR Arena",
      GENERAL: "General Assets",
    };

    relevantAssets.forEach((asset) => {
      let subCat = (asset.subCategory || "").toUpperCase().trim();

      if (!subCat || subCat === "UNCATEGORIZED" || subCat === "ASSETS") {
        const text =
          `${asset.name} ${asset.model} ${asset.serialNumber} ${asset.barcode}`.toLowerCase();
        if (text.includes("pc") || text.match(/\b(vc|bpc|vcm|cpc|mini)\d+/)) subCat = "PC";
        else if (text.includes("mat vr") || text.includes("dito")) subCat = "MAT_VR";
        else if (text.startsWith("vra")) subCat = "VR_ARENA";
        else if (
          text.includes("headset") ||
          text.includes("dpvr") ||
          text.includes("reverb") ||
          text.includes("cosmos") ||
          text.includes("quest") ||
          text.includes("pico") ||
          text.match(/\b(e4c|hp|hc|vp|q2)\d+/)
        )
          subCat = "HEADSET";
        else if (
          text.includes("4dx") ||
          text.includes("i360") ||
          text.includes("esp") ||
          text.includes("psb") ||
          text.includes("vrt")
        )
          subCat = "MACHINE";
        else subCat = "GENERAL";
      }

      const displayName = SUB_CATEGORY_LABELS[subCat] || subCat.replace(/_/g, " ");

      if (!groups[subCat]) {
        groups[subCat] = {
          subCategoryKey: subCat,
          displayName,
          totalCount: 0,
          shopCount: 0,
          warehouseCount: 0,
          assets: [],
          models: {},
        };
      }

      groups[subCat].totalCount += 1;
      if (asset.locationName === "Pulseworks Shop") groups[subCat].shopCount += 1;
      if (asset.locationName === "Pulseworks Warehouse") groups[subCat].warehouseCount += 1;
      groups[subCat].assets.push(asset);

      const modelName = asset.model || "Standard Model";
      groups[subCat].models[modelName] = (groups[subCat].models[modelName] || 0) + 1;
    });

    return Object.values(groups)
      .map((g) => ({
        ...g,
        status: g.totalCount <= 5 ? "Low Stock" : "Healthy",
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [allAssets, allowedLocations]);

  // --- DYNAMIC SITE DEPLOYMENTS TREE (Client Sites) ---
  const deployedSites = useMemo(() => {
    if (!allAssets || allAssets.length === 0) return [];
    const sites: Record<string, any> = {};

    allAssets.forEach((asset) => {
      const loc = asset.locationName || "Unassigned";

      if (allowedLocations.includes(loc)) return;

      if (!sites[loc]) {
        sites[loc] = { name: loc, machines: [], pcs: [], headsets: [], others: [] };
      }

      const subCat = (asset.subCategory || "").toUpperCase().trim();
      const text =
        `${asset.name} ${asset.model} ${asset.serialNumber} ${asset.barcode}`.toLowerCase();

      const isMachine =
        subCat === "MACHINE" ||
        subCat === "MAT_VR" ||
        subCat === "VR_ARENA" ||
        text.includes("4dx") ||
        text.includes("vrt") ||
        text.includes("psb") ||
        text.includes("i360") ||
        text.includes("esp");
      const isPC =
        subCat === "PC" ||
        text.includes("pc") ||
        text.includes("nuc") ||
        text.match(/\b(vc|bpc|vcm|cpc|tpk|tpc)\d+/);
      const isHeadset =
        subCat === "HEADSET" ||
        text.includes("headset") ||
        text.includes("dpvr") ||
        text.includes("reverb") ||
        text.includes("cosmos") ||
        text.includes("quest") ||
        text.includes("pico") ||
        text.match(/\b(e4c|hp|hc|vp|q2)\d+/);

      if (isMachine) {
        sites[loc].machines.push(asset);
      } else if (isPC) {
        sites[loc].pcs.push(asset);
      } else if (isHeadset) {
        sites[loc].headsets.push(asset);
      } else {
        sites[loc].others.push(asset);
      }
    });

    return Object.values(sites).sort((a, b) => a.name.localeCompare(b.name));
  }, [allAssets, allowedLocations]);

  const toggleSiteExpansion = (siteName: string) => {
    setExpandedSites((prev) =>
      prev.includes(siteName) ? prev.filter((name) => name !== siteName) : [...prev, siteName],
    );
  };

  const toggleLocalCategoryExpansion = (catKey: string) => {
    setExpandedLocalCategories((prev) =>
      prev.includes(catKey) ? prev.filter((key) => key !== catKey) : [...prev, catKey],
    );
  };

  const handleSelectUnit = (asset: any) => {
    setScannedAsset(asset);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getSubCategoryIcon = (key: string) => {
    switch (key) {
      case "HEADSET":
        return <Headset className="w-5 h-5 text-pink-600" />;
      case "PC":
        return <Monitor className="w-5 h-5 text-blue-600" />;
      case "MACHINE":
        return <Cpu className="w-5 h-5 text-orange-600" />;
      case "MAT_VR":
        return <Layers className="w-5 h-5 text-teal-600" />;
      case "VR_ARENA":
        return <Settings className="w-5 h-5 text-indigo-600" />;
      default:
        return <Box className="w-5 h-5 text-gray-500" />;
    }
  };

  // Instant Local Search for Assets in the Scanner Box
  useEffect(() => {
    const query = scanInput.toLowerCase().trim();
    if (!query) {
      setAssetSuggestions([]);
      return;
    }

    const filtered = allAssets
      .filter(
        (a: any) =>
          a.name?.toLowerCase().includes(query) ||
          a.barcode?.toLowerCase().includes(query) ||
          a.serialNumber?.toLowerCase().includes(query),
      )
      .slice(0, 8);

    setAssetSuggestions(filtered);
  }, [scanInput, allAssets]);

  // SMART SEARCH FOR WORK ORDERS
  useEffect(() => {
    const query = workOrderQuery.toLowerCase().trim();
    if (!query) {
      setWorkOrderSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const normalizedIdQuery = query.replace(/^wo-?#?/i, "").trim();

      const localFiltered = allWorkOrders.filter(
        (wo: any) =>
          String(wo.id) === normalizedIdQuery ||
          String(wo.id).includes(normalizedIdQuery) ||
          wo.title?.toLowerCase().includes(query) ||
          wo.description?.toLowerCase().includes(query),
      );

      const finalSuggestions = [...localFiltered];

      const hasExactMatch = localFiltered.some((wo: any) => String(wo.id) === normalizedIdQuery);

      if (!hasExactMatch && /^\d+$/.test(normalizedIdQuery)) {
        try {
          const singleWoRes = await fetch(`http://${API_URL}/api/workorders/${normalizedIdQuery}`);
          if (singleWoRes.ok) {
            const singleWo = await singleWoRes.json();
            if (singleWo && singleWo.id && !finalSuggestions.some((w) => w.id === singleWo.id)) {
              finalSuggestions.push(singleWo);
            }
          }
        } catch (err) {
          console.error("Direct WO fetch failed, relying on local search", err);
        }
      }

      setWorkOrderSuggestions(finalSuggestions.slice(0, 8));
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [workOrderQuery, allWorkOrders, API_URL]);

  // --- CAMERA SCANNER LOGIC ---
  const startCameraScan = () => {
    setIsCameraScanning(true);
    setScannedAsset(null);

    setTimeout(() => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          /* verbose= */ false,
        );
        scannerRef.current.render(onScanSuccess, onScanFailure);
      }
    }, 100);
  };

  const stopCameraScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((error) => {
        console.error("Failed to clear scanner", error);
      });
      scannerRef.current = null;
    }
    setIsCameraScanning(false);
  };

  const onScanSuccess = (decodedText: string) => {
    stopCameraScan();
    setScanInput(decodedText);
    processScan(decodedText);
  };

  const onScanFailure = (error: any) => {};

  const handleScanSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (!scanInput.trim()) return;
    processScan(scanInput.trim());
  };

  const processScan = async (searchTarget: string) => {
    setLoading(true);
    setAssetSuggestions([]);
    try {
      const res = await fetch(`http://${API_URL}/api/assets?orgId=${user?.organizationId}`);
      if (res.ok) {
        const data = await res.json();
        const foundAsset = data.find(
          (a: any) =>
            a.barcode?.toLowerCase() === searchTarget.toLowerCase() ||
            a.serialNumber?.toLowerCase() === searchTarget.toLowerCase() ||
            a.name?.toLowerCase() === searchTarget.toLowerCase(),
        );

        if (foundAsset) {
          handleSelectUnit(foundAsset);
        } else {
          alert(`No asset found matching: ${searchTarget}`);
        }
      }
    } catch (err) {
      console.error("Scan error", err);
    } finally {
      setLoading(false);
      setScanInput("");
    }
  };

  const openActionModal = (type: "IN" | "OUT" | "SOFTWARE" | "REPAIR") => {
    if (!scannedAsset) return;
    setActionType(type);

    setDestination(type === "IN" ? user?.siteLocation || "Pulseworks Shop" : "");
    setComment("");
    setWorkOrderQuery("");
    setSelectedWorkOrderId(null);
    setWorkOrderSuggestions([]);

    setMarkAsComplete(true);

    setIsModalOpen(true);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedAsset) return;

    setLoading(true);
    try {
      let woTitle = "";
      let woDescription = "";

      if (actionType === "IN" || actionType === "OUT") {
        const assetRes = await fetch(`http://${API_URL}/api/assets/${scannedAsset.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationName: destination }),
        });

        if (!assetRes.ok) throw new Error("Failed to update asset location.");
        const updatedAsset = await assetRes.json();
        setScannedAsset(updatedAsset);

        setAllAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));

        woTitle = `[Inventory ${actionType === "IN" ? "Check-In" : "Check-Out"}] ${scannedAsset.name} -> ${destination}`;
        woDescription = `Movement Type: ${actionType === "IN" ? "Check-In to Shop" : "Check-Out to Site"}\nDestination: ${destination}\nComments: ${comment || "None"}\nLinked Parent WO: #${selectedWorkOrderId || "None"}`;
      } else if (actionType === "SOFTWARE") {
        woTitle = `PC - Software - ${scannedAsset.barcode || scannedAsset.serialNumber || scannedAsset.name}`;
        woDescription = `Software configuration completed.\nComments: ${comment || "None"}\nLinked Parent WO: #${selectedWorkOrderId || "None"}`;
      } else if (actionType === "REPAIR") {
        woTitle = `PC - Repair - ${scannedAsset.barcode || scannedAsset.serialNumber || scannedAsset.name}`;
        woDescription = `Hardware repair completed.\nComments: ${comment || "None"}\nLinked Parent WO: #${selectedWorkOrderId || "None"}`;
      }

      const newWoRes = await fetch(`http://${API_URL}/api/workorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: woTitle,
          description: woDescription,
          category: "ASSETS",
          priority: "MEDIUM",
          status: "OPEN",
          organizationId: user.organizationId,
          createdBy: user.id,
          assignedTo: user.id,
          assetId: scannedAsset.id,
          siteLocation:
            actionType === "IN" || actionType === "OUT" ? destination : scannedAsset.locationName,
          parentWorkOrderId: selectedWorkOrderId ? Number(selectedWorkOrderId) : null,
        }),
      });

      const newWO = await newWoRes.json();

      if (markAsComplete && newWO.id) {
        await fetch(`http://${API_URL}/api/workorders/${newWO.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETE" }),
        });
      }

      const freshAssetRes = await fetch(
        `http://${API_URL}/api/assets?orgId=${user?.organizationId}`,
      );
      if (freshAssetRes.ok) {
        const freshAssets = await freshAssetRes.json();
        const freshAsset = freshAssets.find((a: any) => a.id === scannedAsset.id);
        if (freshAsset) setScannedAsset(freshAsset);
      }

      setIsModalOpen(false);

      if (actionType === "IN" || actionType === "OUT") {
        alert(
          `Success! Asset moved to ${destination} and tracking Work Order generated automatically.`,
        );
      } else {
        alert(
          `Success! ${actionType === "SOFTWARE" ? "Software" : "Repair"} Work Order created and configured successfully.`,
        );
      }
    } catch (err) {
      console.error(err);
      alert("Error processing action.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full p-8">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-gray-900">Access Denied</h1>
        <p className="text-gray-500 mt-2 text-center max-w-md">
          The Inventory Management system is restricted to personnel stationed at the Pulseworks
          Shop or Pulseworks Warehouse.
        </p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden pb-24 md:pb-8 relative">
      {/* FULL SCREEN CAMERA OVERLAY */}
      {isCameraScanning && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl overflow-hidden mt-auto md:mt-0 p-4">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-black text-lg">Scan QR / Barcode</h3>
              <button
                onClick={stopCameraScan}
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="reader" className="w-full rounded-2xl overflow-hidden shadow-inner"></div>

            <p className="text-center text-xs text-gray-500 mt-4 pb-4">
              Point your camera at the asset tag to scan automatically.
            </p>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8 pb-0 shrink-0">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Inventory Registry
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Supermarket view, Hardware Tracking & Quick Log
            </p>
          </div>
        </div>
      </div>

      <div
        ref={mainScrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 flex flex-col gap-6"
      >
        {/* SCANNER ENGINE CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 relative shrink-0 z-20">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 rounded-l-2xl"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={startCameraScan}
              className="bg-blue-600 hover:bg-blue-700 p-4 rounded-xl text-white shrink-0 shadow-md active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Camera className="w-6 h-6" />
              <span className="font-bold sm:hidden">Open Camera Scanner</span>
            </button>

            <div className="flex-1 w-full relative z-10">
              <h2 className="text-base md:text-lg font-bold text-gray-900 mb-2">Scanner Active</h2>
              <form onSubmit={handleScanSubmit} className="relative">
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={handleScanSubmit}
                  placeholder="Scan barcode or type serial/name & press Enter..."
                  className="w-full pl-4 pr-12 py-3 border-2 border-blue-100 bg-blue-50/30 rounded-xl text-xs md:text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-3 text-blue-600 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg"
                >
                  Go
                </button>

                {/* ASSET SUGGESTIONS DROPDOWN */}
                {assetSuggestions.length > 0 && scanInput && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto">
                    {assetSuggestions.map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => {
                          const targetValue = asset.barcode || asset.serialNumber || asset.name;
                          setScanInput(targetValue);
                          setAssetSuggestions([]);
                          processScan(targetValue);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none flex justify-between items-center transition-colors"
                      >
                        <span className="text-sm font-bold text-gray-900 truncate pr-4">
                          {asset.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md shrink-0">
                          {asset.barcode || asset.serialNumber || "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* IDENTIFIED ASSET CARD - REFINED DESIGN */}
        {scannedAsset && (
          <div className="bg-white rounded-3xl border border-emerald-300 shadow-xl p-5 sm:p-6 md:p-8 animate-in fade-in slide-in-from-top-4 shrink-0 relative z-0">
            <div className="flex justify-between items-start mb-6 gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-inner shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">
                    Active Selected Unit
                  </span>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 leading-snug truncate">
                    {scannedAsset.name}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setScannedAsset(null)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors shrink-0"
              >
                Clear Unit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="p-3.5 sm:p-4 bg-gray-50/80 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                  Current Location
                </span>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{scannedAsset.locationName || "Unknown"}</span>
                </p>
              </div>
              <div className="p-3.5 sm:p-4 bg-gray-50/80 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                  Barcode / S/N
                </span>
                <p className="text-sm font-mono font-bold text-gray-900 truncate">
                  {scannedAsset.barcode || scannedAsset.serialNumber || "N/A"}
                </p>
              </div>
              <div className="p-3.5 sm:p-4 bg-gray-50/80 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                  Hardware Status
                </span>
                <p className="text-sm font-bold text-emerald-700 truncate">{scannedAsset.status}</p>
              </div>
            </div>

            {/* ACTION BUTTON GRID - SEPARATED CONTAINER */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-inner space-y-3">
              <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest block px-1">
                Quick Actions & Maintenance Logs
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => openActionModal("IN")}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Check IN (To Shop)
                </button>
                <button
                  onClick={() => openActionModal("OUT")}
                  className="bg-gray-900 hover:bg-gray-800 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Check OUT (To Site)
                </button>
                <button
                  onClick={() => openActionModal("SOFTWARE")}
                  className="bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 py-3.5 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <MonitorCog className="w-4 h-4" /> Log Software
                </button>
                <button
                  onClick={() => openActionModal("REPAIR")}
                  className="bg-white border border-orange-200 hover:bg-orange-50 text-orange-700 py-3.5 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <PenTool className="w-4 h-4" /> Log Repair
                </button>
              </div>
            </div>

            {/* RECENT WORK ORDERS DISPLAY FOR SCANNED ASSET */}
            {scannedAsset.workOrders && scannedAsset.workOrders.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" /> Recent Associated Work Orders
                </h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {scannedAsset.workOrders.slice(0, 3).map((wo: any) => (
                    <div
                      key={wo.id}
                      className="flex justify-between items-center bg-gray-50 border border-gray-100 p-3.5 rounded-xl"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          WO-{wo.id}: {wo.title}
                        </p>
                        <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-wider">
                          {new Date(wo.createdAt).toLocaleDateString()} •{" "}
                          {wo.category?.replace(/_/g, " ") || "ASSETS"}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 border ${
                          wo.status === "COMPLETE"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : wo.status === "OPEN"
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-gray-100 border-gray-200 text-gray-700"
                        }`}
                      >
                        {wo.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMBINED TABS VIEW */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col z-0">
          <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar bg-gray-50 shrink-0">
            <button
              onClick={() => setInventoryTab("LOCAL")}
              className={`px-6 py-4 text-sm font-black uppercase tracking-wider transition-colors relative whitespace-nowrap flex-1 text-center ${
                inventoryTab === "LOCAL"
                  ? "text-blue-600 bg-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Local Warehouse Stock
              {inventoryTab === "LOCAL" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setInventoryTab("DEPLOYED")}
              className={`px-6 py-4 text-sm font-black uppercase tracking-wider transition-colors relative whitespace-nowrap flex-1 text-center ${
                inventoryTab === "DEPLOYED"
                  ? "text-indigo-600 bg-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Site Deployments Directory
              {inventoryTab === "DEPLOYED" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {/* --- TAB 1: LOCAL WAREHOUSE STOCK (GROUPED BY SUB-CATEGORY) --- */}
            {inventoryTab === "LOCAL" && (
              <div className="p-4 md:p-6 bg-gray-50/50 min-h-full">
                {localStockBySubCategory.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-12">
                    No assets found in Shop or Warehouse locations.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {localStockBySubCategory.map((group) => {
                      const isExpanded = expandedLocalCategories.includes(group.subCategoryKey);

                      return (
                        <div
                          key={group.subCategoryKey}
                          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-blue-200 transition-colors"
                        >
                          {/* Top Row / Click Header */}
                          <div
                            className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-pointer hover:bg-gray-50/80 transition-colors"
                            onClick={() => toggleLocalCategoryExpansion(group.subCategoryKey)}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl shrink-0 shadow-sm">
                                {getSubCategoryIcon(group.subCategoryKey)}
                              </div>
                              <div>
                                <h3 className="font-black text-gray-900 text-base md:text-lg tracking-tight flex items-center gap-2">
                                  {group.displayName}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] font-bold text-gray-500">
                                    Shop:{" "}
                                    <strong className="text-gray-800">{group.shopCount}</strong>
                                  </span>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-[11px] font-bold text-gray-500">
                                    Warehouse:{" "}
                                    <strong className="text-gray-800">
                                      {group.warehouseCount}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between w-full md:w-auto gap-4 pl-12 md:pl-0">
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-lg font-black text-gray-900 block leading-tight">
                                    {group.totalCount}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase text-gray-400">
                                    Total Available
                                  </span>
                                </div>

                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider border shadow-sm ${
                                    group.status === "Low Stock"
                                      ? "bg-orange-50 text-orange-700 border-orange-200"
                                      : "bg-green-50 text-green-700 border-green-200"
                                  }`}
                                >
                                  {group.status}
                                </span>
                              </div>

                              <div className="p-1.5 bg-gray-100 rounded-full shrink-0">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* EXPANDED BREAKDOWN VIEW */}
                          {isExpanded && (
                            <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/50 space-y-5 animate-in fade-in slide-in-from-top-2">
                              {/* Model Distribution Pills */}
                              <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                  <Box className="w-3.5 h-3.5" /> Hardware Model Distribution
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(group.models).map(([model, count]) => (
                                    <div
                                      key={model}
                                      className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-2 shadow-sm"
                                    >
                                      <span>{model}</span>
                                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[11px] font-black">
                                        {count}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Detailed Units Table */}
                              <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5" /> Units in Stock (
                                  {group.assets.length})
                                </h4>

                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-72 overflow-y-auto overflow-x-auto custom-scrollbar">
                                  <table className="min-w-[600px] md:min-w-full divide-y divide-gray-100 text-left">
                                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider sticky top-0 z-10">
                                      <tr>
                                        <th className="px-4 py-3">Asset Name</th>
                                        <th className="px-4 py-3">Model / Style</th>
                                        <th className="px-4 py-3">Serial / Barcode</th>
                                        <th className="px-4 py-3">Location</th>
                                        <th className="px-4 py-3">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                                      {group.assets.map((asset: any) => (
                                        <tr
                                          key={asset.id}
                                          className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                                          onClick={() => handleSelectUnit(asset)}
                                        >
                                          <td className="px-4 py-2.5 font-bold text-gray-900 truncate max-w-[200px]">
                                            {asset.name}
                                          </td>
                                          <td className="px-4 py-2.5 text-gray-600">
                                            {asset.model || "—"}
                                          </td>
                                          <td className="px-4 py-2.5 font-mono text-gray-500">
                                            {asset.serialNumber || asset.barcode || "—"}
                                          </td>
                                          <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center gap-1 text-gray-700 font-bold">
                                              <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                                              {asset.locationName}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5">
                                            <span
                                              className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                asset.status === "OPERATIONAL"
                                                  ? "bg-green-50 text-green-700 border border-green-200"
                                                  : "bg-red-50 text-red-700 border border-red-200"
                                              }`}
                                            >
                                              {asset.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 2: SITE DEPLOYMENTS DIRECTORY --- */}
            {inventoryTab === "DEPLOYED" && (
              <div className="p-4 md:p-6 bg-gray-50/50 min-h-full">
                {deployedSites.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-12">
                    No assets found deployed to external sites.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {deployedSites.map((site) => (
                      <div
                        key={site.name}
                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-200 transition-colors"
                      >
                        <div
                          className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleSiteExpansion(site.name)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shrink-0 border border-indigo-200">
                              <Globe className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-gray-900 text-base md:text-lg tracking-tight">
                              {site.name}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between w-full md:w-auto gap-4 pl-11 md:pl-0">
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-lg border border-orange-200 shadow-sm">
                                {site.machines.length} Machines
                              </span>
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-lg border border-blue-200 shadow-sm">
                                {site.pcs.length} PCs
                              </span>
                              <span className="px-2.5 py-1 bg-pink-50 text-pink-700 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-lg border border-pink-200 shadow-sm">
                                {site.headsets.length} Headsets
                              </span>
                            </div>
                            <div className="p-1 bg-gray-100 rounded-full shrink-0">
                              {expandedSites.includes(site.name) ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* EXPANDED ASSET LISTS */}
                        {expandedSites.includes(site.name) && (
                          <div className="p-5 border-t border-gray-100 bg-gray-50/50 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                            {/* MACHINES COLUMN */}
                            <div>
                              <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-1.5 pb-2 border-b border-orange-100">
                                <Cpu className="w-4 h-4" /> Simulators & Machines (
                                {site.machines.length})
                              </h4>
                              <div className="space-y-2">
                                {site.machines.map((m: any) => (
                                  <div
                                    key={m.id}
                                    onClick={() => handleSelectUnit(m)}
                                    className="p-3 border border-orange-100 rounded-xl bg-white flex justify-between items-center shadow-sm hover:border-orange-400 cursor-pointer transition-all"
                                  >
                                    <div className="flex flex-col min-w-0 pr-2">
                                      <span className="text-xs font-bold text-gray-900 truncate">
                                        {m.name}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                        {m.serialNumber || m.barcode || "N/A"}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shrink-0 border ${m.status === "OPERATIONAL" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
                                    >
                                      {m.status}
                                    </span>
                                  </div>
                                ))}
                                {site.machines.length === 0 && (
                                  <span className="text-xs font-medium text-gray-400 italic">
                                    No machines logged.
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* PCS COLUMN */}
                            <div>
                              <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5 pb-2 border-b border-blue-100">
                                <Monitor className="w-4 h-4" /> Client PCs ({site.pcs.length})
                              </h4>
                              <div className="space-y-2">
                                {site.pcs.map((p: any) => (
                                  <div
                                    key={p.id}
                                    onClick={() => handleSelectUnit(p)}
                                    className="p-3 border border-blue-100 rounded-xl bg-white flex justify-between items-center shadow-sm hover:border-blue-400 cursor-pointer transition-all"
                                  >
                                    <div className="flex flex-col min-w-0 pr-2">
                                      <span className="text-xs font-bold text-gray-900 truncate">
                                        {p.name}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                        {p.serialNumber || p.barcode || "N/A"}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shrink-0 border ${p.status === "OPERATIONAL" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
                                    >
                                      {p.status}
                                    </span>
                                  </div>
                                ))}
                                {site.pcs.length === 0 && (
                                  <span className="text-xs font-medium text-gray-400 italic">
                                    No PCs logged.
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* HEADSETS COLUMN */}
                            <div>
                              <h4 className="text-[11px] font-black text-pink-600 uppercase tracking-widest mb-3 flex items-center gap-1.5 pb-2 border-b border-pink-100">
                                <Headset className="w-4 h-4" /> VR Headsets ({site.headsets.length})
                              </h4>
                              <div className="space-y-2">
                                {site.headsets.map((h: any) => (
                                  <div
                                    key={h.id}
                                    onClick={() => handleSelectUnit(h)}
                                    className="p-3 border border-pink-100 rounded-xl bg-white flex justify-between items-center shadow-sm hover:border-pink-400 cursor-pointer transition-all"
                                  >
                                    <div className="flex flex-col min-w-0 pr-2">
                                      <span className="text-xs font-bold text-gray-900 truncate">
                                        {h.name}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                        {h.serialNumber || h.barcode || "N/A"}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shrink-0 border ${h.status === "OPERATIONAL" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
                                    >
                                      {h.status}
                                    </span>
                                  </div>
                                ))}
                                {site.headsets.length === 0 && (
                                  <span className="text-xs font-medium text-gray-400 italic">
                                    No Headsets logged.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODERN CHECK-IN / CHECK-OUT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-[200] md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl relative w-full max-w-lg p-6 md:p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div
                className={`p-3.5 rounded-xl border ${
                  actionType === "IN"
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : actionType === "OUT"
                      ? "bg-gray-900 border-gray-800 text-white"
                      : actionType === "SOFTWARE"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-orange-50 border-orange-200 text-orange-700"
                }`}
              >
                {actionType === "IN" || actionType === "OUT" ? (
                  <ArrowRightLeft className="w-6 h-6" />
                ) : actionType === "SOFTWARE" ? (
                  <MonitorCog className="w-6 h-6" />
                ) : (
                  <PenTool className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {actionType === "IN"
                    ? "Asset Check-In"
                    : actionType === "OUT"
                      ? "Asset Check-Out"
                      : actionType === "SOFTWARE"
                        ? "Log Software Task"
                        : "Log Repair Task"}
                </h2>
                <p className="text-sm font-bold text-gray-500 truncate max-w-[280px] mt-0.5">
                  {scannedAsset?.name}{" "}
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs ml-1">
                    {scannedAsset?.barcode || scannedAsset?.serialNumber}
                  </span>
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-6 pb-48 md:pb-2">
              {/* Only show destination picker for IN/OUT movements */}
              {(actionType === "IN" || actionType === "OUT") && (
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Destination Location
                  </label>
                  <input
                    type="text"
                    required
                    list="locations-list"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Intrepid Museum or Pulseworks Shop"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  />
                  <datalist id="locations-list">
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.name} />
                    ))}
                  </datalist>
                </div>
              )}

              {/* Show Ticket Title preview for Software/Repair */}
              {(actionType === "SOFTWARE" || actionType === "REPAIR") && (
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Auto-Generated Tracking Ticket
                  </span>
                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-sm">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-900 truncate">
                      PC - {actionType === "SOFTWARE" ? "Software" : "Repair"} -{" "}
                      {scannedAsset?.barcode || scannedAsset?.serialNumber || scannedAsset?.name}
                    </span>
                  </div>
                </div>
              )}

              {/* HIGH Z-INDEX WRAPPER FOR DROPDOWN OVERLAP */}
              <div className="relative z-[200] bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Link to Parent Work Order (Optional)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={workOrderQuery}
                    onChange={(e) => {
                      setWorkOrderQuery(e.target.value);
                      if (!e.target.value) setSelectedWorkOrderId(null);
                    }}
                    placeholder="Search by WO number..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  />
                </div>

                {selectedWorkOrderId && (
                  <div className="mt-3 flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl shadow-sm">
                    <span className="text-xs font-black text-blue-700">
                      Linked to WO #{selectedWorkOrderId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkOrderId(null);
                        setWorkOrderQuery("");
                      }}
                      className="text-blue-600 hover:text-red-600 font-bold text-xs"
                    >
                      Remove Link
                    </button>
                  </div>
                )}

                {/* SUGGESTIONS LIST */}
                {workOrderSuggestions.length > 0 && !selectedWorkOrderId && (
                  <div className="absolute left-5 right-5 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[200] max-h-56 overflow-y-auto">
                    {workOrderSuggestions.map((wo) => (
                      <div
                        key={wo.id}
                        onClick={() => {
                          setSelectedWorkOrderId(wo.id);
                          setWorkOrderQuery(`WO #${wo.id}: ${wo.title}`);
                          setWorkOrderSuggestions([]);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none flex flex-col justify-center transition-colors"
                      >
                        <span className="text-xs font-black text-blue-600">WO #{wo.id}</span>
                        <span className="text-xs font-medium text-gray-700 truncate w-full mt-0.5">
                          {wo.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Comments & Details
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    actionType === "IN" || actionType === "OUT"
                      ? "Add details about condition, repairs made, or shipping notes..."
                      : "Add details about what was installed, configured, or repaired..."
                  }
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white min-h-[100px] transition-all"
                />
              </div>

              {/* IOS STYLE TOGGLE SWITCH */}
              <div
                className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl mt-4 mb-2 cursor-pointer shadow-sm hover:border-gray-300 transition-all"
                onClick={() => setMarkAsComplete(!markAsComplete)}
              >
                <div className="flex flex-col pr-4">
                  <span className="text-sm font-black text-gray-900">
                    Mark Work Order as Complete
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
                    Automatically close this tracking ticket immediately upon creation.
                  </span>
                </div>
                <div
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${markAsComplete ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${markAsComplete ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 text-white py-3.5 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50 text-sm shadow-md ${
                    actionType === "SOFTWARE"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : actionType === "REPAIR"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Processing..." : "Confirm & Generate WO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Inventory;
