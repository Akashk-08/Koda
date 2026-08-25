/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

const Inventory = ({ user }: any) => {
  const [loading, setLoading] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scannedAsset, setScannedAsset] = useState<any | null>(null);

  // Modal State for Check-In / Check-Out
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"IN" | "OUT">("IN");
  const [destination, setDestination] = useState("");
  const [comment, setComment] = useState("");

  // Camera Scanner State
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Work Order & Location States
  const [allWorkOrders, setAllWorkOrders] = useState<any[]>([]); // Holds all WOs locally
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

  // DUMMY DATA FOR INVENTORY REGISTRY SUMMARY
  const inventorySummary = [
    {
      category: "DPVR HEADSETS",
      location: "Pulseworks Shop",
      count: 45,
      status: "Healthy",
    },
    {
      category: "HP VR HEADSETS",
      location: "Pulseworks Shop",
      count: 120,
      status: "Healthy",
    },
    {
      category: "Meta Quest 3 HEADSETS",
      location: "Pulseworks Shop",
      count: 70,
      status: "Healthy",
    },
    {
      category: "Vive Cosmos HEADSETS",
      location: "Pulseworks Shop",
      count: 50,
      status: "Healthy",
    },
    {
      category: "Vive Pro HEADSETS",
      location: "Pulseworks Shop",
      count: 30,
      status: "Healthy",
    },
    {
      category: "VR Client PCS",
      location: "Pulseworks Shop",
      count: 8,
      status: "Low Stock",
    },
    {
      category: "Mini pcs PCS",
      location: "Pulseworks Shop",
      count: 8,
      status: "Low Stock",
    },
  ];

  useEffect(() => {
    if (isAuthorized && scanInputRef.current && !isCameraScanning) {
      scanInputRef.current.focus();
    }
  }, [isAuthorized, isCameraScanning]);

  // Fetch Locations & Work Orders ONCE when component mounts
  useEffect(() => {
    const fetchStaticData = async () => {
      if (!user?.organizationId) return;
      try {
        const [locRes, woRes] = await Promise.all([
          fetch(`http://${API_URL}/api/locations?orgId=${user.organizationId}`),
          fetch(`http://${API_URL}/api/workorders?orgId=${user.organizationId}`), // Removed userId restriction
        ]);
        if (locRes.ok) setLocations(await locRes.json());
        if (woRes.ok) setAllWorkOrders(await woRes.json());
      } catch (err) {
        console.error("Failed to fetch static data", err);
      }
    };
    fetchStaticData();
  }, [user?.organizationId]);

  // Instant Local Search for Work Orders (No API delays)
  useEffect(() => {
    const query = workOrderQuery.toLowerCase().trim();
    if (!query) {
      setWorkOrderSuggestions([]);
      return;
    }

    const filtered = allWorkOrders
      .filter(
        (wo: any) =>
          String(wo.id).includes(query) ||
          wo.title?.toLowerCase().includes(query) ||
          wo.description?.toLowerCase().includes(query),
      )
      .slice(0, 8);

    setWorkOrderSuggestions(filtered);
  }, [workOrderQuery, allWorkOrders]);

  // --- CAMERA SCANNER LOGIC ---
  const startCameraScan = () => {
    setIsCameraScanning(true);
    setScannedAsset(null); // clear previous

    // We delay slightly to ensure the #reader div is rendered
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

  const onScanFailure = (error: any) => {
    // Ignore routine scan failures (when it hasn't locked onto a code yet)
  };

  // --- MANUAL / GUN SCANNER LOGIC ---
  const handleScanSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (!scanInput.trim()) return;
    processScan(scanInput.trim());
  };

  // --- CORE SEARCH LOGIC ---
  const processScan = async (searchTarget: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://${API_URL}/api/assets?orgId=${user?.organizationId}`);
      if (res.ok) {
        const data = await res.json();
        const foundAsset = data.find(
          (a: any) =>
            a.barcode?.toLowerCase() === searchTarget.toLowerCase() ||
            a.serialNumber?.toLowerCase() === searchTarget.toLowerCase() ||
            a.name?.toLowerCase().includes(searchTarget.toLowerCase()),
        );

        if (foundAsset) {
          setScannedAsset(foundAsset);
        } else {
          alert(`No asset found matching: ${searchTarget}`);
        }
      }
    } catch (err) {
      console.error("Scan error", err);
    } finally {
      setLoading(false);
      setScanInput(""); // clear input for next scan
    }
  };

  const openCheckInOutModal = (type: "IN" | "OUT") => {
    if (!scannedAsset) return;
    setActionType(type);
    setDestination(type === "IN" ? user?.siteLocation || "Pulseworks Shop" : "");
    setComment("");
    setWorkOrderQuery("");
    setSelectedWorkOrderId(null);
    setWorkOrderSuggestions([]);
    setIsModalOpen(true);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedAsset) return;

    setLoading(true);
    try {
      const assetRes = await fetch(`http://${API_URL}/api/assets/${scannedAsset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationName: destination }),
      });

      if (!assetRes.ok) throw new Error("Failed to update asset location.");
      const updatedAsset = await assetRes.json();

      const woTitle = `[Inventory ${actionType === "IN" ? "Check-In" : "Check-Out"}] ${scannedAsset.name} -> ${destination}`;
      const woDescription = `Movement Type: ${actionType === "IN" ? "Check-In to Shop" : "Check-Out to Site"}\nDestination: ${destination}\nComments: ${comment || "None"}\nLinked Parent WO: #${selectedWorkOrderId || "None"}`;

      await fetch(`http://${API_URL}/api/workorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: woTitle,
          description: woDescription,
          category: "ASSETS",
          priority: "MEDIUM",
          status: markAsComplete ? "COMPLETE" : "OPEN",
          organizationId: user.organizationId,
          createdBy: user.id,
          assignedTo: user.id,
          assetId: scannedAsset.id,
          siteLocation: destination,
          parentWorkOrderId: selectedWorkOrderId ? Number(selectedWorkOrderId) : null,
        }),
      });

      setScannedAsset(updatedAsset);
      setIsModalOpen(false);
      alert(
        `Success! Asset moved to ${destination} and tracking Work Order generated automatically.`,
      );
    } catch (err) {
      console.error(err);
      alert("Error processing inventory action.");
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

            {/* The actual camera feed element */}
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
              Supermarket view & Quick Check-In/Out
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 flex flex-col gap-6">
        {/* SCANNER ENGINE CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Camera Scan Button */}
            <button
              onClick={startCameraScan}
              className="bg-blue-600 hover:bg-blue-700 p-4 rounded-xl text-white shrink-0 shadow-md active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Camera className="w-6 h-6" />
              <span className="font-bold sm:hidden">Open Camera Scanner</span>
            </button>

            <div className="flex-1 w-full">
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
              </form>
            </div>
          </div>
        </div>

        {/* IDENTIFIED ASSET CARD */}
        {scannedAsset && (
          <div className="bg-white rounded-2xl border-2 border-green-500 shadow-lg p-5 md:p-6 animate-in fade-in slide-in-from-top-4 shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                <h2 className="text-lg md:text-xl font-black text-gray-900 leading-tight">
                  {scannedAsset.name}
                </h2>
              </div>
              <button
                onClick={() => setScannedAsset(null)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Current Location
                </span>
                <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{scannedAsset.locationName || "Unknown"}</span>
                </p>
              </div>
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Barcode
                </span>
                <p className="text-sm font-mono font-bold text-gray-900 mt-1 truncate">
                  {scannedAsset.barcode || scannedAsset.serialNumber || "N/A"}
                </p>
              </div>
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Status
                </span>
                <p className="text-sm font-bold text-green-700 mt-1 truncate">
                  {scannedAsset.status}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => openCheckInOutModal("IN")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-colors shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" /> Check IN (To Shop)
              </button>

              <button
                onClick={() => openCheckInOutModal("OUT")}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-colors shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" /> Check OUT (To Site)
              </button>
            </div>
          </div>
        )}

        {/* STOCK LEVELS VIEW */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <h3 className="font-black text-gray-900 flex items-center gap-2 text-sm md:text-base">
              <Package className="w-5 h-5 text-gray-400" /> Stock Catalog
            </h3>
          </div>

          <div className="flex-1 overflow-auto">
            {/* MOBILE CARD VIEW */}
            <div className="md:hidden p-4 space-y-4">
              {inventorySummary.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                        <Box className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                          {item.category}
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shrink-0 ${item.status === "Low Stock" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="bg-gray-50/60 p-3 rounded-xl border border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">
                        Location
                      </span>
                      <span className="font-bold text-gray-700 truncate block mt-0.5">
                        {item.location}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">
                        Qty Available
                      </span>
                      <span className="font-extrabold text-gray-900 text-sm mt-0.5">
                        {item.count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <table className="hidden md:table min-w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Item Category
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Current Location
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Quantity Available
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Stock Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {inventorySummary.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <Box className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-black text-gray-900">{item.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{item.location}</td>
                    <td className="px-6 py-4 text-base font-black text-gray-900">{item.count}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold ${item.status === "Low Stock" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODERN CHECK-IN / CHECK-OUT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl relative w-full max-w-lg p-6 md:p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div
                className={`p-3 rounded-xl ${actionType === "IN" ? "bg-blue-50 text-blue-600" : "bg-gray-900 text-white"}`}
              >
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {actionType === "IN" ? "Asset Check-In" : "Asset Check-Out"}
                </h2>
                <p className="text-xs text-gray-500 truncate max-w-[220px]">{scannedAsset?.name}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4 pb-48 md:pb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Destination Location
                </label>
                <input
                  type="text"
                  required
                  list="locations-list"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Intrepid Museum or Pulseworks Shop"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="locations-list">
                  {locations.map((loc: any) => (
                    <option key={loc.id} value={loc.name} />
                  ))}
                </datalist>
              </div>

              {/* HIGH Z-INDEX WRAPPER FOR DROPDOWN OVERLAP */}
              <div className="relative z-[100]">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Link to Work Order (Search by ID or Title)
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
                    placeholder="Type WO number or keywords..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {selectedWorkOrderId && (
                  <div className="mt-2 flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700">
                    <span>Linked to Work Order #{selectedWorkOrderId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkOrderId(null);
                        setWorkOrderQuery("");
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* SUGGESTIONS LIST */}
                {workOrderSuggestions.length > 0 && !selectedWorkOrderId && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] max-h-56 overflow-y-auto">
                    {workOrderSuggestions.map((wo) => (
                      <div
                        key={wo.id}
                        onClick={() => {
                          setSelectedWorkOrderId(wo.id);
                          setWorkOrderQuery(`WO #${wo.id}: ${wo.title}`);
                          setWorkOrderSuggestions([]);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none flex flex-col justify-center"
                      >
                        <span className="text-xs font-black text-blue-600">WO #{wo.id}</span>
                        <span className="text-xs font-medium text-gray-700 truncate w-full">
                          {wo.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Comments & Activity Notes
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add details about condition, repairs made, or shipping notes..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer group mt-4 mb-2">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={markAsComplete}
                    onChange={(e) => setMarkAsComplete(e.target.checked)}
                    className="peer w-5 h-5 opacity-0 absolute"
                  />
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-[6px] peer-checked:bg-green-600 peer-checked:border-green-600 transition-colors flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                    Mark Work Order as Complete
                  </span>
                </div>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm shadow-sm"
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
