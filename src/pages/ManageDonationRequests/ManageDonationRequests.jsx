// src/pages/AdminDonationRequest/AdminDonationRequest.jsx
import { useEffect, useMemo, useState } from "react";
import {
  HandHeart,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  User,
  Mail,
  MapPin,
  Phone,
  BookOpen,
  Calendar
} from "lucide-react";
// import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import AdminDashboardSidebar from "../../components/AdminDashboardSidebar/AdminDashboardSidebar";
import api from "../../api";

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function AdminDonationRequest() {
  useEffect(() => {
    document.title = "Admin - Donation Requests";
  }, []);

  // ---------- Data ----------
  const [donationRequests, setDonationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filter and search states
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Status update form state
  const [statusForm, setStatusForm] = useState({
    newStatus: "",
    adminComments: ""
  });

  // Load all donation requests from API
  const loadDonationRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get("/Donations");
      
      if (response.data && Array.isArray(response.data)) {
        setDonationRequests(response.data);
      } else {
        setDonationRequests([]);
      }
    } catch (err) {
      console.error("Error loading donation requests:", err);
      setError("Failed to load donation requests");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadDonationRequests();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !statusForm.newStatus) return;
    
    try {
      setUpdatingStatus(true);
      const response = await api.put(`/Donations/${selectedRequest.donationRequestId}/status`, {
        newStatus: statusForm.newStatus,
        adminComments: statusForm.adminComments
      });
      
      if (response.status === 200) {
        // Update the local state with the new status
        setDonationRequests(prev => 
          prev.map(req => 
            req.donationRequestId === selectedRequest.donationRequestId
              ? { 
                  ...req, 
                  status: statusForm.newStatus,
                  processedDate: new Date().toISOString(),
                  adminComments: statusForm.adminComments
                }
              : req
          )
        );
        
        setShowDetailsModal(false);
        setSelectedRequest(null);
        setStatusForm({
          newStatus: "",
          adminComments: ""
        });
        
        setError(null);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open details modal and prefill form if status is being updated
  const openDetailsModal = (request) => {
    setSelectedRequest(request);
    setStatusForm({
      newStatus: request.status === "Pending" ? "" : request.status,
      adminComments: request.adminComments || ""
    });
    setShowDetailsModal(true);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";
    let icon = <Clock size={14} />;
    
    if (status === "Approved") {
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      icon = <CheckCircle2 size={14} />;
    } else if (status === "Rejected") {
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      icon = <XCircle size={14} />;
    } else if (status === "Pending") {
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      icon = <Clock size={14} />;
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {icon}
        {status}
      </span>
    );
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = donationRequests.length;
    const pending = donationRequests.filter(req => req.status === "Pending").length;
    const approved = donationRequests.filter(req => req.status === "Approved").length;
    const rejected = donationRequests.filter(req => req.status === "Rejected").length;
    
    return { total, pending, approved, rejected };
  }, [donationRequests]);

  // Filter and paginate data
  const filteredAndPaginatedData = useMemo(() => {
    const filtered = donationRequests.filter(req => {
      const matchesSearch = 
        !query ||
        req.bookTitle.toLowerCase().includes(query.toLowerCase()) ||
        req.userName.toLowerCase().includes(query.toLowerCase()) ||
        req.userEmail.toLowerCase().includes(query.toLowerCase()) ||
        req.donationRequestId.toString().includes(query);
      
      const matchesFilter = statusFilter === "all" || req.status === statusFilter;
      
      return matchesSearch && matchesFilter;
    });
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return {
      data: filtered.slice(startIndex, startIndex + itemsPerPage),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalItems: filtered.length
    };
  }, [donationRequests, query, statusFilter, currentPage]);

  // Stat card component
  const StatCard = ({ icon, label, value, tone = "sky" }) => (
    <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm">
      <div
        className={`rounded-full p-2 ${
          tone === "green"
            ? "bg-green-50 text-green-600"
            : tone === "rose"
            ? "bg-rose-50 text-rose-600"
            : tone === "amber"
            ? "bg-amber-50 text-amber-600"
            : "bg-sky-50 text-sky-600"
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-100 overflow-hidden">
      <AdminDashboardSidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <HandHeart className="text-sky-600" /> Donation Requests
            </h1>
            <p className="text-sm text-gray-600">
              Manage all book donation requests and update their status.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<HandHeart size={18} />} label="Total Requests" value={stats.total} />
          <StatCard icon={<Clock size={18} />} label="Pending" value={stats.pending} tone="amber" />
          <StatCard icon={<CheckCircle2 size={18} />} label="Approved" value={stats.approved} tone="green" />
          <StatCard icon={<XCircle size={18} />} label="Rejected" value={stats.rejected} tone="rose" />
        </section>

        {/* Filters */}
        <section className="bg-white rounded-lg shadow border border-gray-300">
          <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by book, user, email or ID"
                className="w-64 md:w-80 rounded border border-gray-300 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="all">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          </div>
        ) : (
          <>
            {/* Requests Table */}
            <section className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">All Donation Requests</h3>
                <span className="text-sm text-gray-500">
                  {filteredAndPaginatedData.totalItems} requests found
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndPaginatedData.data.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                          No donation requests found.
                        </td>
                      </tr>
                    ) : (
                      filteredAndPaginatedData.data.map((request) => (
                        <tr key={request.donationRequestId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{request.donationRequestId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium">{request.bookTitle}</div>
                            {request.authorName && (
                              <div className="text-xs text-gray-500">by {request.authorName}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium">{request.userName}</div>
                            <div className="text-xs text-gray-500">{request.userEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-1 text-gray-400" />
                              {fmtDate(request.requestDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={request.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openDetailsModal(request)}
                              className="text-sky-600 hover:text-sky-900 flex items-center gap-1"
                            >
                              <Edit size={14} /> View/Update
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredAndPaginatedData.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredAndPaginatedData.totalItems)}
                    </span> of{" "}
                    <span className="font-medium">{filteredAndPaginatedData.totalItems}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} className="mr-1" /> Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(filteredAndPaginatedData.totalPages, p + 1))}
                      disabled={currentPage === filteredAndPaginatedData.totalPages}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Details and Update Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Donation Request #{selectedRequest.donationRequestId}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Book Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen size={16} /> Book Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">Book Title</label>
                    <p className="text-sm font-medium">{selectedRequest.bookTitle}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Author</label>
                    <p className="text-sm font-medium">{selectedRequest.authorName || "—"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500">Reason for Donation</label>
                    <p className="text-sm">{selectedRequest.reason || "—"}</p>
                  </div>
                </div>
              </div>
              
              {/* User Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <User size={16} /> User Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">Name</label>
                    <p className="text-sm font-medium">{selectedRequest.userName}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Email</label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Mail size={14} className="text-gray-400" />
                      {selectedRequest.userEmail}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Phone</label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Phone size={14} className="text-gray-400" />
                      {selectedRequest.phoneNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">BrainStation ID</label>
                    <p className="text-sm font-medium">{selectedRequest.brainStationId || "—"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500">Address</label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" />
                      {selectedRequest.address || "—"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Request Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} /> Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">Request Date</label>
                    <p className="text-sm">{fmtDateTime(selectedRequest.requestDate)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Processed Date</label>
                    <p className="text-sm">{selectedRequest.processedDate ? fmtDateTime(selectedRequest.processedDate) : "—"}</p>
                  </div>
                </div>
              </div>
              
              {/* Current Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Current Status</h4>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedRequest.status} />
                </div>
                {selectedRequest.adminComments && (
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500">Admin Comments</label>
                    <p className="text-sm bg-gray-50 p-2 rounded-md">{selectedRequest.adminComments}</p>
                  </div>
                )}
              </div>
              
              {/* Update Status Form (only for pending requests) */}
              {selectedRequest.status === "Pending" && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Update Status</h4>
                  <form onSubmit={handleStatusUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Status *</label>
                      <div className="flex gap-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="newStatus"
                            value="Approved"
                            checked={statusForm.newStatus === "Approved"}
                            onChange={() => setStatusForm(prev => ({ ...prev, newStatus: "Approved" }))}
                            className="text-sky-600 focus:ring-sky-500"
                            required
                          />
                          <span className="ml-2 text-sm text-gray-700">Approve</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="newStatus"
                            value="Rejected"
                            checked={statusForm.newStatus === "Rejected"}
                            onChange={() => setStatusForm(prev => ({ ...prev, newStatus: "Rejected" }))}
                            className="text-sky-600 focus:ring-sky-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Reject</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Comments</label>
                      <textarea
                        name="adminComments"
                        value={statusForm.adminComments}
                        onChange={(e) => setStatusForm(prev => ({ ...prev, adminComments: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"
                        placeholder="Add comments about this decision..."
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowDetailsModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updatingStatus || !statusForm.newStatus}
                        className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50"
                      >
                        {updatingStatus ? "Updating..." : "Update Status"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styles: no-scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}