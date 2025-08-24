import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import AdminDashboardSidebar from "../../components/AdminDashboardSidebar/AdminDashboardSidebar";
import api from "../../api";

export default function ManageCategory() {
  useEffect(() => {
    document.title = "Manage Category";
  }, []);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get("/Categories");
        setCategories(response.data);
      } catch (error) {
        console.error("Error loading categories:", error);
        alert("Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Modal state (Add / Edit)
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const onOpenCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm({ name: "", description: "" });
    setOpen(true);
  };
  
  const onOpenEdit = (category) => {
    setMode("edit");
    setEditingId(category.categoryId);
    setForm({ 
      name: category.name || "", 
      description: category.description || "" 
    });
    setOpen(true);
  };
  
  const onClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "" });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 2000);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Please enter a category name.");
      return;
    }

    try {
      if (mode === "edit" && editingId !== null) {
        // Update existing category - FIXED ENDPOINT
        await api.put(`/Categories/${editingId}`, {
          name: form.name.trim(),
          description: form.description.trim()
        });

        // Update local state
        setCategories(prev => 
          prev.map(cat => 
            cat.categoryId === editingId 
              ? { ...cat, name: form.name.trim(), description: form.description.trim() }
              : cat
          )
        );

        showToast("Category updated successfully");
      } else {
        // Create new category
        const response = await api.post("/Categories", {
          name: form.name.trim(),
          description: form.description.trim()
        });

        // Add to local state - handle different API response formats
        const newCategory = response.data.categoryId 
          ? response.data 
          : { categoryId: Date.now(), ...response.data }; // Fallback for ID

        setCategories(prev => [...prev, newCategory]);
        showToast("Category created successfully");
      }

      setOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       `Failed to ${mode === "edit" ? "update" : "create"} category. Please try again.`;
      alert(errorMsg);
    }
  };

  // Delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingDeleteName, setPendingDeleteName] = useState("");

  const requestDelete = (categoryId, categoryName) => {
    setPendingDeleteId(categoryId);
    setPendingDeleteName(categoryName);
    setConfirmOpen(true);
  };
  
  const onCloseConfirm = () => {
    setPendingDeleteId(null);
    setPendingDeleteName("");
    setConfirmOpen(false);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId === null) return;

    try {
      // Call API to delete - FIXED ENDPOINT
      await api.delete(`/Categories/${pendingDeleteId}`);

      // Remove from local state
      setCategories(prev => prev.filter(cat => cat.categoryId !== pendingDeleteId));
      showToast("Category deleted successfully");
      
      onCloseConfirm();
    } catch (error) {
      console.error("Error deleting category:", error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       "Failed to delete category. Please try again.";
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <AdminDashboardSidebar />

      {/* Main */}
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Manage Category
          </h1>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        <div className="bg-white rounded shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading categories...</div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-3 px-4 min-w-[80px]">#</th>
                      <th className="py-3 px-4 min-w-[220px]">Category Name</th>
                      <th className="py-3 px-4 min-w-[300px]">Description</th>
                      <th className="py-3 px-4 min-w-[160px]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, idx) => (
                      <tr key={category.categoryId} className="border-b last:border-0 even:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{idx + 1}</td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{category.name}</td>
                        <td className="py-3 px-4 text-gray-600">{category.description || "—"}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenEdit(category)}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDelete(category.categoryId, category.name)}
                              className="inline-flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {categories.length === 0 && !loading && (
                <div className="p-8 text-center text-gray-500">
                  No categories found. Click "Add Category" to create one.
                </div>
              )}

              <div className="px-4 py-3 text-xs text-gray-500 md:hidden">
                Tip: swipe horizontally to see all columns.
              </div>
            </>
          )}
        </div>
      </main>

      {/* -------- Modal: Add/Edit Category -------- */}
      {open && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 opacity-0 animate-[fadeIn_.2s_ease-out_forwards]" />
          {/* Panel */}
          <div className="absolute inset-0 flex items-start justify-center pt-10">
            <div className="w-full max-w-2xl mx-4 rounded-lg bg-white shadow-lg border border-gray-200 opacity-0 translate-y-2 animate-[popIn_.22s_ease-out_forwards]">
              <div className="px-6 py-4 border-b flex items-center gap-2">
                <Plus size={20} className="text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {mode === "edit" ? "Edit Category" : "Add Category"}
                </h3>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Type category name"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Type category description (optional)"
                    rows={3}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-white flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------- Delete Confirmation Modal -------- */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseConfirm();
          }}
        >
          <div className="absolute inset-0 bg-black/50 opacity-0 animate-[fadeIn_.2s_ease-out_forwards]" />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-lg opacity-0 translate-y-2 animate-[popIn_.2s_ease-out_forwards]">
              <div className="px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertTriangle className="text-amber-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Are you sure you want to delete this category?
                    </h3>
                    {pendingDeleteName && (
                      <p className="mt-1 text-sm text-gray-600">
                        Category: <span className="font-medium">{pendingDeleteName}</span>
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-600">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCloseConfirm}
                  className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------- Toast -------- */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[60] pointer-events-none animate-[toastIn_.25s_ease-out]">
          <div className="pointer-events-auto flex items-start gap-3 rounded-xl bg-white shadow-lg ring-1 ring-black/5 px-4 py-3">
            <div className="mt-0.5">
              <CheckCircle2 className="text-green-600" size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Success</p>
              <p className="text-xs text-gray-600">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* animations */}
      <style>{`
        @keyframes fadeIn { to { opacity: 1 } }
        @keyframes popIn { to { opacity: 1; transform: translateY(0) } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform:translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}