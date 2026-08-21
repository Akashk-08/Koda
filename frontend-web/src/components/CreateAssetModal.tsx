/* eslint-disable @typescript-eslint/no-unused-vars */
// frontend-web/src/components/CreateAssetModal.tsx
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
} from "lucide-react";

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

const DEFAULT_LOCATIONS = [
  "Pulseworks Shop",
  "LSC-Liberty Science Center",
  "Museum of Flight",
  "USS Midway",
  "USS Lexington",
  "Patriots Point",
  "Intrepid Sea, Air & Space Museum",
];
const API_URL = "192.168.1.92:8080";

const CreateAssetModal = ({ isOpen, onClose, user, onCreated }: any) => {
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    model: "",
    serialNumber: "",
    barcode: "",
    category: "",
    locationName: "",
    status: "OPERATIONAL",
    uptime: "100%",
    downtime: "0 hrs",
    reliabilityScore: "A+",
  });

  useEffect(() => {
    const fetchLocations = async () => {
      if (isOpen && user?.organizationId) {
        try {
          const res = await fetch(
            `http://${API_URL}/api/assets?orgId=${user.organizationId}`,
          );
          if (res.ok) {
            const assets = await res.json();
            const locationNames = new Set<string>(DEFAULT_LOCATIONS);
            assets.forEach((a: any) => {
              if (a.locationName) locationNames.add(a.locationName);
            });
            setLocations(Array.from(locationNames).sort());
          }
        } catch (err) {
          console.error("Using default locations:", err);
        }
      }
    };
    fetchLocations();
  }, [isOpen, user?.organizationId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Asset name is required.");

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://${API_URL}/api/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          category: formData.category || null,
          locationName: formData.locationName || null,
          organizationId: user.organizationId,
        }),
      });
      if (res.ok) {
        setFormData({
          name: "",
          description: "",
          model: "",
          serialNumber: "",
          barcode: "",
          category: "",
          locationName: "",
          status: "OPERATIONAL",
          uptime: "100%",
          downtime: "0 hrs",
          reliabilityScore: "A+",
        });
        onCreated();
        onClose();
      } else {
        alert("Failed to create asset.");
      }
    } catch (err) {
      alert("Server error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm text-gray-900";
  const labelClasses =
    "block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 sm:p-6">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
              <Box className="w-6 h-6 text-blue-600" /> Create New Asset
            </h2>
            <p className="text-xs font-medium text-gray-500 mt-1">
              Configure asset details, uptime, and downtime tracking metrics.
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

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6 sm:p-8 space-y-6">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <div>
                <label className={labelClasses}>
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. FANA-509 Galaxy"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </label>
                  <select
                    value={formData.locationName}
                    onChange={(e) =>
                      setFormData({ ...formData, locationName: e.target.value })
                    }
                    className={`${inputClasses} cursor-pointer`}
                  >
                    <option value="">Select a location...</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className={`${inputClasses} cursor-pointer`}
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Identifiers & Status */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>
                    <Hash className="w-3.5 h-3.5" /> Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SN-009"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <Barcode className="w-3.5 h-3.5" /> Barcode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BC-009"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <Settings className="w-3.5 h-3.5" /> Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Galaxy Pro"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className={`${inputClasses} cursor-pointer font-bold ${formData.status === "OPERATIONAL" ? "text-green-700" : "text-red-700"}`}
                  >
                    <option value="OPERATIONAL">🟢 Operational</option>
                    <option value="DAMAGED">🔴 Damaged</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Uptime & Downtime Inputs */}
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
                    onChange={(e) =>
                      setFormData({ ...formData, uptime: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, downtime: e.target.value })
                    }
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

            {/* Description */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <label className={labelClasses}>
                <FileText className="w-3.5 h-3.5" /> Description
              </label>
              <textarea
                rows={3}
                placeholder="Add any technical specs or notes..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`${inputClasses} resize-y min-h-[100px]`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-8 py-5 bg-white border-t border-gray-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
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
