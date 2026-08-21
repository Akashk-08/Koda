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
} from "lucide-react";
const API_URL = "192.168.1.92:8080";

const Inventory = ({ user }: any) => {
  const [loading, setLoading] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scannedAsset, setScannedAsset] = useState<any | null>(null);

  // Modal State for Check-In / Check-Out
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"IN" | "OUT">("IN");
  const [destination, setDestination] = useState("");
  const [comment, setComment] = useState("");

  // Work Order & Location States
  const [workOrderQuery, setWorkOrderQuery] = useState("");
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(
    null,
  );
  const [workOrderSuggestions, setWorkOrderSuggestions] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]); // Store fetched locations

  const [markAsComplete, setMarkAsComplete] = useState(true); // Set to true to make it the default!

  // Dummy data : fixed dynamic rendering below
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

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Security & Access Control
  const allowedLocations = ["Pulseworks Shop", "Pulseworks Warehouse"];
  const isAuthorized =
    user?.role === "ADMIN" ||
    allowedLocations.includes(user?.siteLocation || "");

  useEffect(() => {
    if (isAuthorized && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [isAuthorized]);

  // Fetch Locations for the Destination Dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      if (!user?.organizationId) return;
      try {
        const res = await fetch(
          `http://${API_URL}/api/locations?orgId=${user.organizationId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
        }
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    };
    fetchLocations();
  }, [user?.organizationId]);

  // Fetch Work Order Suggestions
  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const res = await fetch(
          `http://${API_URL}/api/workorders?orgId=${user.organizationId}&userId=${user.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          const query = workOrderQuery.toLowerCase().trim();

          if (!query) {
            setWorkOrderSuggestions([]);
            return;
          }

          const filtered = data
            .filter(
              (wo: any) =>
                String(wo.id).includes(query) ||
                wo.title?.toLowerCase().includes(query) ||
                wo.description?.toLowerCase().includes(query),
            )
            .slice(0, 8);

          setWorkOrderSuggestions(filtered);
        }
      } catch (err) {
        console.error("Error fetching work order suggestions", err);
      }
    };

    const timer = setTimeout(fetchWorkOrders, 200);
    return () => clearTimeout(timer);
  }, [workOrderQuery, user]);

  // Scanner Gun Listener
  const handleScanSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && scanInput.trim() !== "") {
      e.preventDefault();
      setLoading(true);

      try {
        const res = await fetch(
          `http://${API_URL}/api/assets?orgId=${user?.organizationId}`,
        );
        if (res.ok) {
          const data = await res.json();
          const foundAsset = data.find(
            (a: any) =>
              a.barcode?.toLowerCase() === scanInput.trim().toLowerCase() ||
              a.serialNumber?.toLowerCase() === scanInput.trim().toLowerCase(),
          );

          if (foundAsset) {
            setScannedAsset(foundAsset);
          } else {
            alert(`No asset found for: ${scanInput}`);
          }
        }
      } catch (err) {
        console.error("Scan error", err);
      } finally {
        setLoading(false);
        setScanInput("");
      }
    }
  };

  const openCheckInOutModal = (type: "IN" | "OUT") => {
    if (!scannedAsset) return;
    setActionType(type);
    setDestination(
      type === "IN" ? user?.siteLocation || "Pulseworks Shop" : "",
    );
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
      const assetRes = await fetch(
        `http://${API_URL}/api/assets/${scannedAsset.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationName: destination }),
        },
      );

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
          status: markAsComplete ? "COMPLETE" : "OPEN", // To mark the WO to completed
          organizationId: user.organizationId,
          createdBy: user.id,
          assignedTo: user.id,
          assetId: scannedAsset.id,
          siteLocation: destination,
          parentWorkOrderId: selectedWorkOrderId
            ? Number(selectedWorkOrderId)
            : null,
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
          The Inventory Management system is restricted to personnel stationed
          at the Pulseworks Shop or Pulseworks Warehouse.
        </p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      <div className="p-8 pb-0 shrink-0">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Inventory Registry
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Supermarket view & Quick Check-In/Out
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-6">
        {/* SCANNER ENGINE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <div className="flex items-center gap-6">
            <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
              <ScanLine className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Scanner Active
              </h2>
              <input
                ref={scanInputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={handleScanSubmit}
                placeholder="Scan barcode or type serial number and press Enter..."
                className="w-full max-w-xl pl-4 pr-4 py-3 border-2 border-blue-100 bg-blue-50/30 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* IDENTIFIED ASSET CARD */}
        {scannedAsset && (
          <div className="bg-white rounded-2xl border-2 border-green-500 shadow-lg p-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-black text-gray-900">
                  Asset Identified: {scannedAsset.name}
                </h2>
              </div>
              <button
                onClick={() => setScannedAsset(null)}
                className="text-sm font-bold text-gray-400 hover:text-gray-700"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Current Location
                </span>
                <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />{" "}
                  {scannedAsset.locationName || "Unknown"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Barcode
                </span>
                <p className="text-sm font-mono font-bold text-gray-900 mt-1">
                  {scannedAsset.barcode || scannedAsset.serialNumber || "N/A"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Status
                </span>
                <p className="text-sm font-bold text-green-700 mt-1">
                  {scannedAsset.status}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => openCheckInOutModal("IN")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
              >
                <ArrowRightLeft className="w-5 h-5" /> Check IN (To Shop)
              </button>

              <button
                onClick={() => openCheckInOutModal("OUT")}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
              >
                <ArrowRightLeft className="w-5 h-5" /> Check OUT (To Client /
                Site)
              </button>
            </div>
          </div>
        )}

        {/* SUPERMARKET VIEW */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" /> Global Stock Levels
            </h3>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                  <tr
                    key={idx}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Box className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-black text-gray-900">
                          {item.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-600">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 text-lg font-black text-gray-900">
                      {item.count}
                    </td>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl relative w-full max-w-lg p-8 animate-in fade-in zoom-in duration-200">
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
                <p className="text-sm text-gray-500">{scannedAsset?.name}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              {/* DESTINATION LOCATION WITH DATALIST */}
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

              {/* SEARCHABLE WORK ORDER INPUT */}
              <div className="relative">
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
                    placeholder="Type WO number or keywords (e.g. 9084, repair)..."
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

                {workOrderSuggestions.length > 0 && !selectedWorkOrderId && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                    {workOrderSuggestions.map((wo) => (
                      <div
                        key={wo.id}
                        onClick={() => {
                          setSelectedWorkOrderId(wo.id);
                          setWorkOrderQuery(`WO #${wo.id}: ${wo.title}`);
                          setWorkOrderSuggestions([]);
                        }}
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none flex items-center justify-between"
                      >
                        <span className="text-xs font-black text-blue-600">
                          WO #{wo.id}
                        </span>
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[280px]">
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
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px]"
                />
              </div>

              {/* AUTO-COMPLETE CHECKBOX */}
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
                  <span className="text-[14px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                    Mark Work Order as Complete
                  </span>
                </div>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
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
