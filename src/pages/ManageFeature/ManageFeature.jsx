// src/pages/ManageFeature/ManageFeature.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../api"; // Import your custom api instance
import {
  SlidersHorizontal,
  RefreshCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  BookOpen,
  Search,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminDashboardSidebar from "../../components/AdminDashboardSidebar/AdminDashboardSidebar";

/* ---------- Small UI bits ---------- */

function Switch({ checked, onChange, disabled }) {
  return (
    <label className="inline-flex items-center select-none">
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={!!checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
        />
        <span
          className={`
            h-5 w-9 rounded-full transition-colors
            ${checked ? "bg-sky-600" : "bg-gray-300"}
            ${disabled ? "opacity-60" : ""}
            relative after:content-[''] after:absolute after:top-0.5 after:left-0.5
            after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform
            ${checked ? "peer-checked:after:translate-x-4 after:translate-x-4" : ""}
          `}
        />
      </span>
    </label>
  );
}

/* ---------- Helpers to normalize data ---------- */

const normalizeFeatured = (item) => {
  return {
    featuredId: String(item.featuredBookId || item.id || Math.random().toString(36).slice(2)),
    bookId: String(item.bookId || item.book_id || ""),
    title: item.title || "—",
    author: item.authorName || item.author || "—",
    category: item.categoryName || item.category || "—",
    featuredDate: item.featuredDate || "",
  };
};

const normalizeCatalog = (b) => {
  const cover = b.coverImagePath || b.coverImage || b.image || 
               "https://dummyimage.com/160x160/e5e7eb/9ca3af&text=📘";
  return {
    id: String(b.bookId || b.id || Math.random().toString(36).slice(2)),
    title: b.title || "—",
    author: b.authorName || b.author || b.authors || "—",
    category: b.categoryName || b.category || "—",
    cover,
    summary: b.summary || "",
  };
};

/* ---------- Page ---------- */

export default function ManageFeature() {
  useEffect(() => {
    document.title = "• Featured Books";
  }, []);

  // server state
  const [loading, setLoading] = useState(false);
  const [featured, setFeatured] = useState([]);
  const [error, setError] = useState("");

  // catalog (books)
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all");

  // per-card pending toggles
  const [pendingById, setPendingById] = useState({});

  // remove confirm
  const [confirm, setConfirm] = useState({ open: false, book: null });

  // toast
  const [toast, setToast] = useState({ show: false, msg: "" });
  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 1600);
  };

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 items per page

  /* -------- load all books from backend -------- */
  const fetchAllBooks = async () => {
    try {
      const response = await api.get("/Books");
      const data = Array.isArray(response.data.items) ? response.data.items : [];
      setCatalog(data.map(normalizeCatalog));
    } catch (error) {
      console.error("Error fetching books:", error);
      setError("Could not load books. Try Refresh.");
      setCatalog([]);
    }
  };

  /* -------- load featured books from backend -------- */
  const fetchFeatured = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/FeaturedBooks");
      const data = Array.isArray(response.data) ? response.data : [];
      setFeatured(data.map(normalizeFeatured));
    } catch (error) {
      console.error("Error fetching featured books:", error);
      setError("Could not load featured books. Try Refresh.");
      setFeatured([]);
    } finally {
      setLoading(false);
    }
  };

  /* -------- load initial data -------- */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchAllBooks(), fetchFeatured()]);
      } catch (error) {
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* -------- fast lookups -------- */
  const featuredMapByBookId = useMemo(() => {
    const m = new Map();
    featured.forEach((f) => m.set(f.bookId, f));
    return m;
  }, [featured]);

  /* -------- filtered catalog for search/view -------- */
  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = catalog.filter((c) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });

    if (view === "checked") {
      return base.filter((c) => featuredMapByBookId.has(c.id));
    }
    if (view === "unchecked") {
      return base.filter((c) => !featuredMapByBookId.has(c.id));
    }
    return base;
  }, [catalog, search, view, featuredMapByBookId]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCatalog.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCatalog.slice(indexOfFirstItem, indexOfLastItem);

  const checkedCount = featured.length;

  /* -------- actions: add to featured (POST) -------- */
  const setPending = (bookId, v) =>
    setPendingById((prev) => ({ ...prev, [bookId]: v }));

  const handleCheck = async (book) => {
    if (featuredMapByBookId.has(book.id)) return;
    
    setPending(book.id, true);
    setError("");
    
    try {
      await api.post("/FeaturedBooks", {
        bookId: parseInt(book.id)
      });
      
      // Refresh the featured list to get the updated data
      await fetchFeatured();
      showToast("Book marked as Featured.");
    } catch (error) {
      console.error("Error adding featured book:", error);
      setError("Add failed. Please try again.");
    } finally {
      setPending(book.id, false);
    }
  };

  /* -------- actions: remove from featured (DELETE) -------- */
  const askUncheck = (book) => setConfirm({ open: true, book });
  const closeConfirm = () => setConfirm({ open: false, book: null });

  const doUncheck = async () => {
    const book = confirm.book;
    if (!book) return;
    
    const featuredItem = featuredMapByBookId.get(book.id);
    if (!featuredItem) {
      closeConfirm();
      return;
    }
    
    setPending(book.id, true);
    setError("");
    
    try {
      await api.delete(`/FeaturedBooks/${featuredItem.featuredId}`);
      
      // Update local state immediately for better UX
      setFeatured((prev) => prev.filter((x) => x.featuredId !== featuredItem.featuredId));
      showToast("Removed from Featured.");
      closeConfirm();
    } catch (error) {
      console.error("Error removing featured book:", error);
      setError("Remove failed. Please try again.");
    } finally {
      setPending(book.id, false);
    }
  };

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  /* -------- UI -------- */
  return (
    <div className="min-h-screen flex bg-gray-100">
      <AdminDashboardSidebar />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-gray-400 font-normal">• Featured Books</span>
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setCurrentPage(1); // Reset to first page on refresh
                Promise.all([fetchAllBooks(), fetchFeatured()]).finally(() => 
                  setLoading(false)
                );
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-200 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
              Refresh
            </button>
          </div>
        </header>

        {/* Toolbar: search + filters + counts */}
        <section className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  placeholder="Search by title, author, category, or ID…"
                  className="w-full rounded border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setView("all");
                    setCurrentPage(1); // Reset to first page when changing view
                  }}
                  className={`px-3 py-1.5 text-sm ${view === "all" ? "bg-gray-100 text-gray-800 font-medium" : "text-gray-700"}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("checked");
                    setCurrentPage(1); // Reset to first page when changing view
                  }}
                  className={`px-3 py-1.5 text-sm ${view === "checked" ? "bg-gray-100 text-gray-800 font-medium" : "text-gray-700"}`}
                >
                  Checked
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("unchecked");
                    setCurrentPage(1); // Reset to first page when changing view
                  }}
                  className={`px-3 py-1.5 text-sm ${view === "unchecked" ? "bg-gray-100 text-gray-800 font-medium" : "text-gray-700"}`}
                >
                  Unchecked
                </button>
              </div>

              <span className="hidden md:inline-flex items-center gap-1 text-sm text-gray-600">
                <Filter size={16} />
                <span>Featured:</span>
                <span className="font-semibold">{checkedCount}</span>
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Cards grid */}
        <section className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Loading skeletons while GET featured in progress */}
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={`sk-${i}`} className="rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="h-28 w-full rounded bg-gray-100 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-3/5 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/5 mb-4" />
                  <div className="h-9 bg-gray-100 rounded" />
                </div>
              ))}

            {!loading && currentItems.length === 0 && (
              <div className="col-span-full text-sm text-gray-500">
                No books match your search.
              </div>
            )}

            {!loading &&
              currentItems.map((b) => {
                const checked = featuredMapByBookId.has(b.id);
                const pending = !!pendingById[b.id];

                return (
                  <article
                    key={b.id}
                    className={`rounded-lg border p-4 cursor-pointer transition
                                ${checked ? "border-sky-300 ring-1 ring-sky-100 bg-sky-50/30" : "border-gray-200 bg-white"}
                               `}
                    onClick={() => (checked ? askUncheck(b) : handleCheck(b))}
                  >
                    <div className="h-28 w-full rounded bg-gray-50 overflow-hidden ring-1 ring-gray-200 flex items-center justify-center">
                      {b.cover ? (
                        <img src={b.cover} alt={b.title} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="text-gray-400" size={24} />
                      )}
                    </div>

                    <div className="min-h-[56px] mt-3">
                      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <BookOpen size={15} className="text-gray-400" />
                        <span className="line-clamp-2">{b.title}</span>
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">{b.author}</p>
                      <p className="text-xs text-gray-500">{b.category}</p>
                    </div>

                    {/* Top-right small switch */}
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ring-1
                          ${checked ? "bg-green-50 text-green-700 ring-green-200" : "bg-gray-50 text-gray-600 ring-gray-200"}
                        `}
                      >
                        {checked ? "Featured" : "Not Featured"}
                      </span>

                      <Switch
                        checked={checked}
                        disabled={pending}
                        onChange={(on) => {
                          if (on) handleCheck(b);
                          else askUncheck(b);
                        }}
                      />
                    </div>
                  </article>
                );
              })}
          </div>

          {/* Pagination Controls */}
          {!loading && filteredCatalog.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCatalog.length)} of {filteredCatalog.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`w-8 h-8 rounded-md text-sm ${
                      currentPage === page 
                        ? "bg-sky-600 text-white" 
                        : "border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ===== Uncheck Confirmation Modal ===== */}
      {confirm.open && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfirm();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 opacity-0 animate-[fadeIn_.2s_ease-out_forwards]" />
          {/* Panel */}
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-lg border border-gray-200 opacity-0 translate-y-2 animate-[popIn_.22s_ease-out_forwards]">
              <div className="px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertTriangle className="text-amber-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Remove from Featured?</h3>
                    {confirm.book && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">{confirm.book.title}</span> will be removed
                        from the featured list.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={doUncheck}
                  className="rounded-md px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 focus:ring-2 focus:ring-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Toast ===== */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[60] pointer-events-none animate-[toastIn_.25s_ease-out]">
          <div className="pointer-events-auto flex items-start gap-3 rounded-xl bg-white shadow-lg ring-1 ring-black/5 px-4 py-3">
            <div className="mt-0.5">
              <CheckCircle2 className="text-green-600" size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Success</p>
              <p className="text-xs text-gray-600">{toast.msg}</p>
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