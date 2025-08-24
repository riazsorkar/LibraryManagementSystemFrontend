// src/pages/admin/AdminSettings.jsx
import { useEffect, useState } from "react";
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  Settings as SettingsIcon,
  CalendarDays,
  BookOpen,
  RotateCcw,
  RefreshCw
} from "lucide-react";
import AdminDashboardSidebar from "../../components/AdminDashboardSidebar/AdminDashboardSidebar";
import api from "../../api";

function SettingRow({ icon, title, help, value, onChange, id, unit = "days" }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-gray-200">
      <div className="flex items-start sm:items-center gap-3">
        <span className="shrink-0 mt-0.5 sm:mt-0 text-sky-600">{icon}</span>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-600">{help}</p>
        </div>
      </div>

      <div className="sm:min-w-[220px]">
        <div className="relative">
          <input
            id={id}
            type="number"
            min={1}
            step={1}
            value={value}
            onChange={(e) => onChange(Math.max(1, Number(e.target.value || 1)))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  useEffect(() => {
    document.title = "Admin Settings";
  }, []);

  // Default values matching backend model
  const defaults = {
    maxBorrowDuration: 14,
    maxExtensionLimit: 1,
    maxBorrowLimit: 5,
    maxBookingDuration: 7,
    maxBookingLimit: 3,
  };

  const [settings, setSettings] = useState({ ...defaults });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  // Fetch settings from API
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/systemsettings');
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setToast({
        show: true,
        msg: "Failed to load settings. Using defaults.",
        type: "error"
      });
      setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const onSave = () => setConfirmOpen(true);

  const doSave = async () => {
    setConfirmOpen(false);
    setIsSaving(true);
    
    try {
      const response = await api.put('/systemsettings', settings);
      setSettings(response.data);
      setToast({
        show: true,
        msg: "Settings saved successfully!",
        type: "success"
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      setToast({
        show: true,
        msg: "Failed to save settings. Please try again.",
        type: "error"
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3000);
    }
  };

  const resetDefaults = () => {
    setSettings({ ...defaults });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-gray-100">
        <AdminDashboardSidebar />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="animate-spin" size={20} />
            <span>Loading settings...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <AdminDashboardSidebar />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <SettingsIcon className="text-gray-700" size={20} />
            Admin Settings
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetDefaults}
              className="hidden sm:inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        {/* Limits card */}
        <section className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <CalendarDays size={18} className="text-gray-700" />
            <h2 className="font-semibold text-gray-800">Circulation & Booking Limits</h2>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            <SettingRow
              id="maxBorrowDuration"
              icon={<BookOpen size={18} />}
              title="Max Borrow Duration"
              help="Maximum number of days a book can be borrowed"
              value={settings.maxBorrowDuration}
              onChange={(v) => updateSetting("maxBorrowDuration", v)}
            />

            <SettingRow
              id="maxExtensionLimit"
              icon={<BookOpen size={18} />}
              title="Max Extension Limit"
              help="How many times a borrow can be extended"
              value={settings.maxExtensionLimit}
              onChange={(v) => updateSetting("maxExtensionLimit", v)}
              unit="times"
            />

            <SettingRow
              id="maxBorrowLimit"
              icon={<BookOpen size={18} />}
              title="Max Borrow Limit"
              help="Maximum number of books a user can borrow at once"
              value={settings.maxBorrowLimit}
              onChange={(v) => updateSetting("maxBorrowLimit", v)}
              unit="books"
            />

            <SettingRow
              id="maxBookingDuration"
              icon={<CalendarDays size={18} />}
              title="Max Booking Duration"
              help="Maximum number of days a book can be booked in advance"
              value={settings.maxBookingDuration}
              onChange={(v) => updateSetting("maxBookingDuration", v)}
            />

            <SettingRow
              id="maxBookingLimit"
              icon={<CalendarDays size={18} />}
              title="Max Booking Limit"
              help="Maximum number of books a user can book at once"
              value={settings.maxBookingLimit}
              onChange={(v) => updateSetting("maxBookingLimit", v)}
              unit="books"
            />
          </div>
        </section>
      </main>

      {/* Save confirmation modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/50 opacity-0 animate-[fadeIn_.2s_ease-out_forwards]" />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-lg border border-gray-200 opacity-0 translate-y-2 animate-[popIn_.22s_ease-out_forwards]">
              <div className="px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertTriangle className="text-amber-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Apply these changes?
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Limits will update for all users immediately after saving.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={doSave}
                  className="rounded-md px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 focus:ring-2 focus:ring-sky-400"
                >
                  Confirm & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[60] pointer-events-none animate-[toastIn_.25s_ease-out]">
          <div className={`pointer-events-auto flex items-start gap-3 rounded-xl shadow-lg ring-1 ring-black/5 px-4 py-3 ${
            toast.type === "success" ? "bg-green-50" : "bg-red-50"
          }`}>
            <div className="mt-0.5">
              {toast.type === "success" ? (
                <CheckCircle2 className="text-green-600" size={22} />
              ) : (
                <AlertTriangle className="text-red-600" size={22} />
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${
                toast.type === "success" ? "text-green-900" : "text-red-900"
              }`}>
                {toast.type === "success" ? "Success" : "Error"}
              </p>
              <p className={`text-xs ${
                toast.type === "success" ? "text-green-700" : "text-red-700"
              }`}>
                {toast.msg}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* animations */}
      <style>{`
        @keyframes fadeIn { to { opacity: 1 } }
        @keyframes popIn { to { opacity: 1; transform: translateY(0) } }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px) scale(.98) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
    </div>
  );
}