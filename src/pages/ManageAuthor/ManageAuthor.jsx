import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminDashboardSidebar from "../../components/AdminDashboardSidebar/AdminDashboardSidebar";
import api from "../../api";

export default function ManageAuthors() {
  useEffect(() => {
    document.title = "Manage Authors";
  }, []);

  // Authors state
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load authors from API
  useEffect(() => {
    const loadAuthors = async () => {
      try {
        setLoading(true);
        const response = await api.get("/Authors");
        setAuthors(response.data);
      } catch (error) {
        console.error("Error loading authors:", error);
        alert("Failed to load authors. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadAuthors();
  }, []);

  // --------- Pagination state ----------
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page

  // Calculate pagination values
  const totalItems = authors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = authors.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Modal state (Add / Edit)
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", biography: "" });

  const onOpenCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm({ name: "", biography: "" });
    setOpen(true);
  };
  
  const onOpenEdit = (author) => {
    setMode("edit");
    setEditingId(author.authorId);
    setForm({ 
      name: author.name || "", 
      biography: author.biography || "" 
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
      alert("Please enter an author name.");
      return;
    }

    try {
      if (mode === "edit" && editingId !== null) {
        // Update existing author
        await api.put(`/Authors/${editingId}`, {
          name: form.name.trim(),
          biography: form.biography.trim()
        });

        // Update local state
        setAuthors(prev => 
          prev.map(author => 
            author.authorId === editingId 
              ? { ...author, name: form.name.trim(), biography: form.biography.trim() }
              : author
          )
        );

        showToast("Author updated successfully");
      } else {
        // Create new author
        const response = await api.post("/Authors", {
          name: form.name.trim(),
          biography: form.biography.trim()
        });

        // Add to local state - handle different API response formats
        const newAuthor = response.data.authorId 
          ? response.data 
          : { authorId: Date.now(), ...response.data }; // Fallback for ID

        setAuthors(prev => [...prev, newAuthor]);
        showToast("Author created successfully");
      }

      setOpen(false);
    } catch (error) {
      console.error("Error saving author:", error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       `Failed to ${mode === "edit" ? "update" : "create"} author. Please try again.`;
      alert(errorMsg);
    }
  };

  // Delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingDeleteName, setPendingDeleteName] = useState("");

  const requestDelete = (authorId, authorName) => {
    setPendingDeleteId(authorId);
    setPendingDeleteName(authorName);
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
      // Call API to delete
      await api.delete(`/Authors/${pendingDeleteId}`);

      // Remove from local state
      setAuthors(prev => prev.filter(author => author.authorId !== pendingDeleteId));
      showToast("Author deleted successfully");
      
      onCloseConfirm();
    } catch (error) {
      console.error("Error deleting author:", error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       "Failed to delete author. Please try again.";
      alert(errorMsg);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible page range
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = 4;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis if needed after first page
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed before last page
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <AdminDashboardSidebar />

      {/* Main */}
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Manage Authors
          </h1>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <Plus size={16} /> Add Author
          </button>
        </div>

        <div className="bg-white rounded shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading authors...</div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b text-gray-900 ">
                      <th className="py-3 px-4 min-w-[80px]">#</th>
                      <th className="py-3 px-4 min-w-[220px]">Author Name</th>
                      <th className="py-3 px-4 min-w-[300px]">Biography</th>
                      <th className="py-3 px-4 min-w-[160px]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((author, idx) => (
                      <tr key={author.authorId} className="border-b last:border-0 even:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{startIndex + idx + 1}</td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{author.name}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {author.biography && author.biography.length > 100 
                            ? `${author.biography.substring(0, 100)}...` 
                            : author.biography || "—"
                          }
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenEdit(author)}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDelete(author.authorId, author.name)}
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

              {authors.length === 0 && !loading && (
                <div className="p-8 text-center text-gray-500">
                  No authors found. Click "Add Author" to create one.
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} authors
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' ? goToPage(page) : null}
                        disabled={page === '...'}
                        className={`min-w-[2.25rem] px-2 py-1.5 rounded-md border text-sm ${
                          page === currentPage
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        } ${page === '...' ? 'cursor-default' : ''}`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="px-4 py-3 text-xs text-gray-500 md:hidden">
                Tip: swipe horizontally to see all columns.
              </div>
            </>
          )}
        </div>
      </main>

      {/* -------- Modal: Add/Edit Author -------- */}
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
                  {mode === "edit" ? "Edit Author" : "Add Author"}
                </h3>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Author Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Type author name"
                    className="text-gray-900 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Biography
                  </label>
                  <textarea
                    name="biography"
                    value={form.biography}
                    onChange={handleChange}
                    placeholder="Type author biography (optional)"
                    rows={4}
                    className="text-gray-900 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                      Are you sure you want to delete this author?
                    </h3>
                    {pendingDeleteName && (
                      <p className="mt-1 text-sm text-gray-600">
                        Author: <span className="font-medium">{pendingDeleteName}</span>
                      </p>
                    )
                    }
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