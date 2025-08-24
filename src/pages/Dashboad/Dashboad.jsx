import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api";
import AdminDashboardSidebar from "../../components/AdminDashboardSidebar/AdminDashboardSidebar";

const PLACEHOLDER_IMG = "https://via.placeholder.com/40";

export default function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [pendingBorrows, setPendingBorrows] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageBorrowed, setCurrentPageBorrowed] = useState(1);
  const [pageSize] = useState(10);
  
  useEffect(() => {
    document.title = "Library Dashboard";
  }, []);

  useEffect(() => {
    // Fetch dashboard statistics
    const fetchStatistics = async () => {
      try {
        const response = await api.get("/admin/dashboard");
        setStatistics(response.data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    fetchStatistics();
  }, []);

  useEffect(() => {
    // Fetch pending borrow requests
    const fetchPendingBorrows = async () => {
      try {
        const response = await api.get(`/admin/borrows/pending?page=${currentPagePending}&pageSize=${pageSize}`);
        setPendingBorrows(response.data.pendingBorrows || []);
      } catch (error) {
        console.error("Error fetching pending borrows:", error);
      }
    };

    fetchPendingBorrows();
  }, [currentPagePending, pageSize]);

  useEffect(() => {
    // Fetch borrowed books
    const fetchBorrowedBooks = async () => {
      try {
        const response = await api.get(`/admin/borrows/Borrowed?page=${currentPageBorrowed}&pageSize=${pageSize}`);
        setBorrowedBooks(response.data.borrowedBorrows || []);
      } catch (error) {
        console.error("Error fetching borrowed books:", error);
      }
    };

    fetchBorrowedBooks();
  }, [currentPageBorrowed, pageSize]);

  // Confirmation modal state
  const [confirm, setConfirm] = useState({ open: false, type: null, borrow: null });
  const openConfirm = (type, borrow) => setConfirm({ open: true, type, borrow });
  const closeConfirm = () => setConfirm({ open: false, type: null, borrow: null });

  // Toast (2s)
  const [toast, setToast] = useState({ show: false, type: "accept", message: "" });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type, message: "" }), 2000);
  };

  const handleBorrowAction = async (type, borrowId) => {
    try {
      const url = `/admin/borrows/${type}/${borrowId}`;
      const requestBody = type === 'reject' ? { reason: "Rejected by administrator" } : {};
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
      await api.post(url, requestBody, config);
      
      // Remove from pending list if action was taken
      if (type === 'approve' || type === 'reject') {
        setPendingBorrows(prev => prev.filter(borrow => borrow.borrowId !== borrowId));
      }
      
      // Show success toast
      showToast(type === 'approve' ? 'accept' : 'reject', 
                type === 'approve' ? "Request accepted" : "Request rejected");
    } catch (error) {
      console.error(`Error ${type} borrow request:`, error);
      const msg = error.response?.data?.message || error.message || `Failed to ${type} request.`;
      alert(msg);
    }
  };

  const doConfirm = async () => {
    const { type, borrow } = confirm;
    if (!borrow) return;

    try {
      await handleBorrowAction(type, borrow.borrowId);
    } finally {
      closeConfirm();
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // -------------------- WEEKLY LINE CHART --------------------
  const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Keep your 3 series but name them Borrowed/Returned/Overdue (weekly base)
  const series = useMemo(
    () => [
      { name: "Borrowed", color: "stroke-sky-500", dot: "fill-sky-500", values: [20, 55, 62, 28, 24, 68, 64] },
      { name: "Returned", color: "stroke-amber-500", dot: "fill-amber-400", values: [48, 40, 30, 18, 22, 42, 58] },
      { name: "Overdue", color: "stroke-rose-500", dot: "fill-rose-500", values: [10, 30, 55, 58, 26, 40, 88] },
    ],
    []
  );

  // Smooth path helpers (quadratic mid-point)
  const chartBox = { w: 720, h: 200, padX: 36, padY: 20 };
  const allVals = series.flatMap((s) => s.values);
  const yMax = Math.max(1, Math.ceil(Math.max(...allVals) / 10) * 10);
  const yMin = 0;

  const sx = (i) =>
    chartBox.padX + (i * (chartBox.w - chartBox.padX * 2)) / (WEEK_LABELS.length - 1);
  const sy = (v) =>
    chartBox.h - chartBox.padY - ((v - yMin) / (yMax - yMin)) * (chartBox.h - chartBox.padY * 2);

  const makeSmoothPath = (vals) => {
    const pts = vals.map((v, i) => ({ x: sx(i), y: sy(v) }));
    if (!pts.length) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const xc = (pts[i - 1].x + pts[i].x) / 2;
      const yc = (pts[i - 1].y + pts[i].y) / 2;
      d += ` Q ${pts[i - 1].x} ${pts[i - 1].y}, ${xc} ${yc}`;
    }
    d += ` T ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
    return d;
  };

  const paths = series.map((s) => ({ ...s, d: makeSmoothPath(s.values) }));

  // Stroke-draw animation
  const pathRefs = useRef([]);
  useEffect(() => {
    pathRefs.current.forEach((el, i) => {
      if (!el) return;
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      // reflow then animate
      el.getBoundingClientRect();
      el.style.transition = `stroke-dashoffset 900ms ease ${i * 140}ms`;
      el.style.strokeDashoffset = "0";
    });
  }, [paths.map((p) => p.d).join("|")]);

  // "Updated" timestamp
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <AdminDashboardSidebar />

      {/* Main */}
      <main className="flex-1 p-6 space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statistics ? [
            { label: "Total Books", value: statistics.totalBooks },
            { label: "Available Books", value: statistics.availableBooks },
            { label: "Borrowed Books", value: statistics.totalBorrowedBooks },
            { label: "Overdue Books", value: statistics.overdueBooks },
            { label: "New Members", value: statistics.newMembersThisMonth },
            { label: "Pending Donation Requests", value: statistics.pendingDonationRequests },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded shadow p-4 text-center">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-xl font-bold text-gray-800">{item.value}</p>
            </div>
          )) : (
            // Loading state for statistics
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded shadow p-4 text-center">
                <p className="text-sm text-gray-500">Loading...</p>
                <p className="text-xl font-bold text-gray-800">—</p>
              </div>
            ))
          )}
        </div>

        {/* Graph + Borrowed Books */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ---------------------- CHECK-OUT STATISTICS (Weekly Line Chart; legend BELOW) ---------------------- */}
          <div className="bg-white rounded shadow p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold mb-2">Check-Out Statistics</h3>
              <span className="text-xs text-gray-500">Updated {hh}:{mm}:{ss}</span>
            </div>

            {/* Chart centered */}
            <div className="w-full flex justify-center">
              <svg
                viewBox={`0 0 ${chartBox.w} ${chartBox.h}`}
                width="100%"
                height="220"
                className="max-w-full"
                aria-label="Weekly Dynamics Line Chart"
              >
                {/* grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                  const y = chartBox.padY + t * (chartBox.h - chartBox.padY * 2);
                  return (
                    <line
                      key={i}
                      x1={chartBox.padX}
                      x2={chartBox.w - chartBox.padX}
                      y1={y}
                      y2={y}
                      className="stroke-gray-200"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* baseline */}
                <line
                  x1={chartBox.padX}
                  x2={chartBox.w - chartBox.padX}
                  y1={chartBox.h - chartBox.padY}
                  y2={chartBox.h - chartBox.padY}
                  className="stroke-gray-300"
                  strokeWidth="1"
                />

                {/* x labels */}
                {WEEK_LABELS.map((w, i) => (
                  <text
                    key={w}
                    x={sx(i)}
                    y={chartBox.h - 6}
                    textAnchor="middle"
                    className="fill-gray-400"
                    style={{ fontSize: 10 }}
                  >
                    {w}
                  </text>
                ))}

                {/* animated lines + dots */}
                {paths.map((p, idx) => (
                  <g key={idx}>
                    <path
                      ref={(el) => (pathRefs.current[idx] = el)}
                      d={p.d}
                      className={`${p.color}`}
                      fill="none"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {p.values.map((v, i) => (
                      <circle
                        key={i}
                        cx={sx(i)}
                        cy={sy(v)}
                        r="3.4"
                        className={`${p.dot} stroke-white`}
                        strokeWidth="1.2"
                      />
                    ))}
                  </g>
                ))}
              </svg>
            </div>

            {/* Weekly legend UNDER chart (three horizontal blocks) */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {series.map((s) => (
                <div key={s.name} className="flex items-start gap-3">
                  <span
                    className={`mt-2 inline-block w-8 h-1.5 rounded-full ${s.color.replace(
                      "stroke",
                      "bg"
                    )}`}
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{s.name}</p>
                    <p className="text-[11px] leading-4 text-gray-400">Mon – Sun</p>
                    <p className="text-[11px] leading-4 text-gray-400">7 pts</p>
                    <p className="text-[11px] leading-4 text-gray-400">Updated weekly</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------------- Currently Borrowed Books ---------------------- */}
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Currently Borrowed Books</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th>#</th>
                  <th>Book Title</th>
                  <th>User Name</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {borrowedBooks.map((book, i) => (
                  <tr key={book.borrowId} className="border-b border-gray-200">
                    <td>{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{book.bookTitle}</td>
                    <td>{book.userName}</td>
                    <td>{formatDate(book.borrowDate)}</td>
                    <td>{formatDate(book.dueDate)}</td>
                  </tr>
                ))}
                {borrowedBooks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      No borrowed books.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Borrow Requests */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Pending Borrow Requests</h3>
            <Link to="#" className="text-xs text-green-600 hover:underline">
              View All
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th>#</th>
                <th>Book Title</th>
                <th>User Name</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingBorrows.map((request, i) => (
                <tr key={request.borrowId} className="border-b border-gray-200">
                  <td>{i + 1}</td>
                  <td className="py-3 px-4 font-medium">{request.bookTitle}</td>
                  <td>{request.userName}</td>
                  <td>{formatDate(request.borrowDate)}</td>
                  <td>{formatDate(request.dueDate)}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openConfirm("approve", request)}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => openConfirm("reject", request)}
                        className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pendingBorrows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No pending borrow requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ---- Confirm Modal (Accept / Reject) ---- */}
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
                    {confirm.type === "approve" ? (
                      <CheckCircle2 className="text-green-600" size={24} />
                    ) : (
                      <AlertTriangle className="text-amber-500" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {confirm.type === "approve"
                        ? "Approve this borrow request?"
                        : "Reject this borrow request?"}
                    </h3>
                    {confirm.borrow && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">
                          {confirm.borrow.bookTitle}
                        </span>{" "}
                        — {confirm.borrow.userName}
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
                  onClick={doConfirm}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${confirm.type === "approve"
                    ? "bg-green-600 hover:bg-green-500 focus:ring-2 focus:ring-green-400"
                    : "bg-red-600 hover:bg-red-500 focus:ring-2 focus:ring-red-400"
                    }`}
                >
                  {confirm.type === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Toast (2s) ---- */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[60] pointer-events-none animate-[toastIn_.25s_ease-out]">
          <div className="pointer-events-auto flex items-start gap-3 rounded-xl bg-white shadow-lg ring-1 ring-black/5 px-4 py-3">
            <div className="mt-0.5">
              {toast.type === "accept" ? (
                <CheckCircle2 className="text-green-600" size={22} />
              ) : (
                <XCircle className="text-red-600" size={22} />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {toast.type === "accept" ? "Approved" : "Rejected"}
              </p>
              <p className="text-xs text-gray-600">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* animations */}
      <style>{`
        @keyframes fadeIn { to { opacity: 1 } }
        @keyframes popIn { to { opacity: 1; transform: translateY(0) } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}