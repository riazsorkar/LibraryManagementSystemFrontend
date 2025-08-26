// src/pages/ManageBooks/ManageBooks.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  FileAudio2,
  CheckCircle2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../api";
import AdminDashboardSidebar from "../../components/AdminDashboardSidebar/AdminDashboardSidebar";

const PLACEHOLDER_IMG = "../../../uploads/images/dummy_cover.png";

// ---------- helpers ----------
function toYMD(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function normalizeBookData(item) {
  return {
    bookId: item.bookId,
    title: item.title ?? "—",
    author: item.authorName ?? "—",
    category: item.categoryName ?? "—",
    categoryId: item.categoryId ?? "",
    authorId: item.authorId ?? "",
    copies: item.totalCopies,
    availableCopies: item.availableCopies,
    updatedOn: toYMD(item.publishDate ?? ""),
    cover: item.coverImagePath ?? PLACEHOLDER_IMG,
    pdf: item.softCopyAvailable ?? "",
    audio: item.audioFileAvailable ?? "",
    description: item.summary ?? "",
    hardCopyAvailable: item.hardCopyAvailable ?? false,
  };
}

export default function ManageBooks() {
  useEffect(() => {
    document.title = "Manage Books";
  }, []);

  // --------- load books from API ----------
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/Books");
      const normalizedBooks = response.data.map(normalizeBookData);
      setBooks(normalizedBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
      alert("Failed to load books. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBooks();
  }, []);

  // --------- Pagination state ----------
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page

  // Calculate pagination values
  const totalItems = books.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = books.slice(startIndex, endIndex);

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

  // --------- load categories and authors for dropdowns ----------
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/Categories");
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };

    const fetchAuthors = async () => {
      try {
        const res = await api.get("/Authors");
        setAuthors(res.data || []);
      } catch (err) {
        console.error("Error fetching authors:", err);
        setAuthors([]);
      }
    };

    fetchCategories();
    fetchAuthors();
  }, []);

  // --------- Add/Edit modal state ----------
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);

  // --------- Delete confirmation modal state ----------
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingDeleteTitle, setPendingDeleteTitle] = useState("");

  // ------------ FORM ------------
  const emptyForm = {
    title: "",
    summary: "",
    categoryId: "",
    authorId: "",
    coverImagePath: "",
    hardCopyAvailable: true,
    softCopyAvailable: "",
    audioFileAvailable: "",
    totalCopies: "",
    availableCopies: "",
    coverFile: null,
    pdfFile: null,
    audioFile: null,
    imageLoading: false,
    pdfLoading: false,
    audioLoading: false,
  };

  const [form, setForm] = useState(emptyForm);

  const rowToForm = (row) => ({
    title: row.title || "",
    summary: row.description || "",
    categoryId: row.categoryId || "",
    authorId: row.authorId || "",
    coverImagePath: row.cover || "",
    hardCopyAvailable: row.hardCopyAvailable || true,
    softCopyAvailable: row.pdf || "",
    audioFileAvailable: row.audio || "",
    totalCopies: row.copies ? String(row.copies) : "",
    availableCopies: row.availableCopies ? String(row.availableCopies) : "",
    coverFile: null,
    pdfFile: null,
    audioFile: null,
    imageLoading: false,
    pdfLoading: false,
    audioLoading: false,
  });

  const onOpenCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const onOpenEdit = (book) => {
    setMode("edit");
    setEditingId(book.bookId);
    setForm(rowToForm(book));
    setOpen(true);
  };

  const onClose = useCallback(() => setOpen(false), []);
  const onCloseConfirm = useCallback(() => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteTitle("");
  }, []);

  // lock page scroll when any modal open
  useEffect(() => {
    const anyOpen = open || confirmOpen;
    document.body.style.overflow = anyOpen ? "hidden" : "";
  }, [open, confirmOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // file inputs
  const handleFile = (e, kind) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (kind === "image") {
      setForm((f) => ({ ...f, imageLoading: true }));
      const url = URL.createObjectURL(file);
      setTimeout(() => {
        setForm((f) => ({
          ...f,
          coverFile: file,
          coverImagePath: url,
          imageLoading: false,
        }));
      }, 500);
    } else if (kind === "pdf") {
      setForm((f) => ({ ...f, pdfLoading: true }));
      setTimeout(() => {
        setForm((f) => ({
          ...f,
          pdfFile: file,
          softCopyAvailable: file.name,
          pdfLoading: false,
        }));
      }, 500);
    } else if (kind === "audio") {
      setForm((f) => ({ ...f, audioLoading: true }));
      setTimeout(() => {
        setForm((f) => ({
          ...f,
          audioFile: file,
          audioFileAvailable: file.name,
          audioLoading: false,
        }));
      }, 500);
    }
  };

  const removeFile = (kind) => {
    if (kind === "image") {
      setForm((f) => ({ 
        ...f, 
        coverFile: null, 
        coverImagePath: "" 
      }));
    } else if (kind === "pdf") {
      setForm((f) => ({ 
        ...f, 
        pdfFile: null, 
        softCopyAvailable: "" 
      }));
    } else if (kind === "audio") {
      setForm((f) => ({ 
        ...f, 
        audioFile: null, 
        audioFileAvailable: "" 
      }));
    }
  };

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "" });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 2000);
  };

  const handleSave = async () => {
    if (!form.title) {
      alert("Please enter a book title.");
      return;
    }
    if (!form.categoryId) {
      alert("Please select a category.");
      return;
    }
    if (!form.authorId) {
      alert("Please select an author.");
      return;
    }

    setSaving(true);

    try {
      // For this implementation, we'll just use the file names as paths
      // In a real application, you would upload these files to a server
      // and get back the actual file paths
      const coverImagePath = form.coverFile 
        ? `/uploads/images/${form.coverFile.name}` 
        : form.coverImagePath || PLACEHOLDER_IMG;
      
      const softCopyAvailable = form.pdfFile 
        ? `/uploads/pdfs/${form.pdfFile.name}` 
        : form.softCopyAvailable;
      
      const audioFileAvailable = form.audioFile 
        ? `/uploads/audio/${form.audioFile.name}` 
        : form.audioFileAvailable;

      const bookData = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        categoryId: parseInt(form.categoryId),
        authorId: parseInt(form.authorId),
        coverImagePath: coverImagePath,
        hardCopyAvailable: form.hardCopyAvailable,
        softCopyAvailable: softCopyAvailable,
        audioFileAvailable: audioFileAvailable,
        totalCopies: parseInt(form.totalCopies) || 0,
        availableCopies: parseInt(form.availableCopies) || 0,
      };

      if (mode === "edit" && editingId !== null) {
        // Update existing book
        await api.put(`/Books/${editingId}`, bookData);
        
        // Update local state
        setBooks(prev => 
          prev.map(book => 
            book.bookId === editingId 
              ? { ...book, ...bookData }
              : book
          )
        );
        
        showToast("Book updated successfully");
      } else {
        // Create new book
        const response = await api.post("/Books", bookData);
        
        // Add to local state
        const newBook = normalizeBookData(response.data);
        setBooks(prev => [newBook, ...prev]);
        showToast("Book created successfully");
      }

      setOpen(false);
    } catch (error) {
      console.error("Error saving book:", error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       `Failed to ${mode === "edit" ? "update" : "create"} book. Please try again.`;
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (bookId, bookTitle) => {
    setPendingDeleteId(bookId);
    setPendingDeleteTitle(bookTitle);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId === null) return;

    try {
      // Call delete API
      await api.delete(`/Books/${pendingDeleteId}`);

      // Remove from local state
      setBooks(prev => prev.filter(book => book.bookId !== pendingDeleteId));
      showToast("Book deleted successfully");
      
      onCloseConfirm();
    } catch (error) {
      console.error("Error deleting book:", error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       "Failed to delete book. Please try again.";
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Manage Books</h1>

        {/* Books List */}
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Books List</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenCreate}
                className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <Plus size={16} /> Add Book
              </button>
            </div>
          </div>

          <div className="px-4 pb-4">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading books...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-gray-600">
                        <th className="py-3 px-4">Book</th>
                        <th className="py-3 px-4">Author</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 whitespace-nowrap">No of copy</th>
                        <th className="py-3 px-4">Available</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((book) => (
                        <tr key={book.bookId} className="border-b last:border-0 even:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={book.cover || PLACEHOLDER_IMG}
                                alt={book.title}
                                className="h-10 w-10 rounded object-cover bg-gray-100 flex-shrink-0"
                              />
                              <p className="font-semibold text-gray-800 truncate">
                                {book.title}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{book.author}</td>
                          <td className="py-3 px-4 text-gray-700">{book.category}</td>
                          <td className="py-3 px-4 text-gray-700">{book.copies ?? "—"}</td>
                          <td className="py-3 px-4 text-gray-700">{book.availableCopies ?? "—"}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onOpenEdit(book)}
                                className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                              >
                                <Pencil size={14} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDelete(book.bookId, book.title)}
                                className="inline-flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {books.length === 0 && !loading && (
                        <tr>
                          <td colSpan={6} className="py-6 px-4 text-center text-gray-500">
                            No books found. Click "Add Book" to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} books
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
              </>
            )}
          </div>
        </section>
      </main>

      {/* ---------- Add/Edit Book Modal ---------- */}
      {open && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="absolute inset-0 bg-black/50 opacity-0 animate-[fadeIn_.2s_ease-out_forwards]" />
          <div className="absolute inset-0 flex items-start justify-center pt-8 md:pt-12 overflow-y-auto">
            <div className="w-full max-w-3xl md:max-w-4xl mx-4 rounded-lg bg-white shadow-lg opacity-0 translate-y-3 scale-[0.98] animate-[popIn_.22s_ease-out_forwards] my-8">
              <div className="px-6 py-4 flex items-center gap-2 border-b">
                {mode === "edit" ? (
                  <Pencil size={20} className="text-gray-700" />
                ) : (
                  <Plus size={20} className="text-gray-700" />
                )}
                <h3 className="text-lg font-semibold text-gray-800">
                  {mode === "edit" ? "Edit book" : "Add book"}
                </h3>
              </div>

              <div className="px-6 pb-2 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Book Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Book Title *</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Book title"
                      className=" text-gray-900 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      required
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Author *</label>
                    <select
                      name="authorId"
                      value={form.authorId}
                      onChange={handleChange}
                      className="text-gray-900 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      required
                    >
                      <option value="">Select an author</option>
                      {authors.map((author) => (
                        <option key={author.authorId} value={author.authorId}>
                          {author.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Category *</label>
                    <select
                      name="categoryId"
                      value={form.categoryId}
                      onChange={handleChange}
                      className="text-gray-900 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Total Copies */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Total Copies</label>
                    <input
                      name="totalCopies"
                      type="number"
                      value={form.totalCopies}
                      onChange={handleChange}
                      placeholder="Total copies"
                      className="text-gray-900 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  {/* Available Copies */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Available Copies</label>
                    <input
                      name="availableCopies"
                      type="number"
                      value={form.availableCopies}
                      onChange={handleChange}
                      placeholder="Available copies"
                      className="text-gray-900 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  {/* Hard Copy Available */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Hard Copy Available</label>
                    <label className="flex items-center mt-2">
                      <input
                        name="hardCopyAvailable"
                        type="checkbox"
                        checked={form.hardCopyAvailable}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Available</span>
                    </label>
                  </div>

                  {/* Cover Image */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Cover Image</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={form.coverImagePath || PLACEHOLDER_IMG}
                          alt="Preview"
                          className="h-16 w-16 rounded object-cover bg-gray-100"
                        />
                        {form.coverImagePath && form.coverImagePath !== PLACEHOLDER_IMG && (
                          <button
                            type="button"
                            onClick={() => removeFile("image")}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        )}
                        {form.imageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                            <Loader2 className="animate-spin text-white" size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block w-full cursor-pointer">
                          <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            <Upload size={16} />
                            <span>Choose cover image</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFile(e, "image")}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Soft Copy */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Soft Copy (PDF)</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-16 w-16 rounded bg-gray-100 flex items-center justify-center">
                          <FileText className="text-gray-400" size={24} />
                        </div>
                        {form.softCopyAvailable && (
                          <button
                            type="button"
                            onClick={() => removeFile("pdf")}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        )}
                        {form.pdfLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                            <Loader2 className="animate-spin text-white" size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        {form.softCopyAvailable ? (
                          <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-2">
                            <span className="text-sm text-gray-700 truncate">
                              {form.softCopyAvailable}
                            </span>
                          </div>
                        ) : (
                          <label className="block w-full cursor-pointer">
                            <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                              <Upload size={16} />
                              <span>Choose PDF file</span>
                            </div>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleFile(e, "pdf")}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Audio File */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Audio File</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-16 w-16 rounded bg-gray-100 flex items-center justify-center">
                          <FileAudio2 className="text-gray-400" size={24} />
                        </div>
                        {form.audioFileAvailable && (
                          <button
                            type="button"
                            onClick={() => removeFile("audio")}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        )}
                        {form.audioLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                            <Loader2 className="animate-spin text-white" size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        {form.audioFileAvailable ? (
                          <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-2">
                            <span className="text-sm text-gray-700 truncate">
                              {form.audioFileAvailable}
                            </span>
                          </div>
                        ) : (
                          <label className="block w-full cursor-pointer">
                            <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                              <Upload size={16} />
                              <span>Choose audio file</span>
                            </div>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => handleFile(e, "audio")}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Summary</label>
                    <textarea
                      name="summary"
                      value={form.summary}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Book summary"
                      className="text-gray-900 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 flex justify-end gap-3 bg-gray-50 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-70"
                >
                  {mode === "edit" ? (saving ? "Updating…" : "Update") : saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Delete Confirmation Modal ---------- */}
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
                      Are you sure you want to delete this book?
                    </h3>
                    {pendingDeleteTitle && (
                      <p className="mt-1 text-sm text-gray-600">
                        Book: <span className="font-medium">{pendingDeleteTitle}</span>
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-600">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
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

      {/* Toast */}
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
        @keyframes popIn { to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}