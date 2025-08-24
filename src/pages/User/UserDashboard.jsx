// src/pages/user/UserProfile.jsx
import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  RotateCcw, 
  XCircle,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  X
} from "lucide-react";
import UserSidebar from "../../components/UserSidebar/UserSidebar";
import Navbar from "../../components/Navbar/Navbar";
import api from "../../api";
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const [profileData, setProfileData] = useState(null);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extendingBorrow, setExtendingBorrow] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [newDueDate, setNewDueDate] = useState("");
  const navigate = useNavigate();

  // Fetch user profile and borrow history
  useEffect(() => {
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const profileResponse = await api.get("/user/profile");
      setProfileData(profileResponse.data);
      
      const historyResponse = await api.get("/Borrows/my-borrows");
      setBorrowHistory(historyResponse.data);
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      if (error.response?.status === 403 && error.config?.url === "/user/profile") {
        navigate("/dashboard"); // Use React Router navigation
        return;
      }
      
      alert("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  fetchUserData();
}, [navigate]);

  // Handle opening extend form
  const handleOpenExtendForm = (borrow) => {
    // Set default new due date to 7 days from current due date
    const defaultDate = new Date(borrow.dueDate);
    defaultDate.setDate(defaultDate.getDate() + 7);
    setNewDueDate(defaultDate.toISOString().split('T')[0]);
    setExtendingBorrow(borrow);
  };

  // Handle closing extend form
  const handleCloseExtendForm = () => {
    setExtendingBorrow(null);
    setNewDueDate("");
  };

  // Handle extend borrow with custom date
  const handleExtendBorrow = async () => {
    try {
      setActionLoading(extendingBorrow.borrowId);
      
      const extendData = {
        borrowId: extendingBorrow.borrowId,
        newDueDate: new Date(newDueDate).toISOString()
      };

      await api.post("/Borrows/extend", extendData);
      
      // Refresh data
      const historyResponse = await api.get("/Borrows/my-borrows");
      setBorrowHistory(historyResponse.data);
      
      alert("Borrow period extended successfully!");
      handleCloseExtendForm();
      
    } catch (error) {
      console.error("Error extending borrow:", error);
      alert(error.response?.data?.message || "Failed to extend borrow period");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle return book
  const handleReturnBook = async (borrowId) => {
    try {
      setActionLoading(borrowId);
      
      await api.post(`/Borrows/return/${borrowId}`);
      
      // Refresh data
      const historyResponse = await api.get("/Borrows/my-borrows");
      setBorrowHistory(historyResponse.data);
      
      alert("Book returned successfully!");
      
    } catch (error) {
      console.error("Error returning book:", error);
      alert(error.response?.data?.message || "Failed to return book");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle cancel borrow request
  const handleCancelBorrow = async (borrowId) => {
    try {
      setActionLoading(borrowId);
      
      await api.post(`/Borrows/cancel/${borrowId}`);
      
      // Refresh data
      const historyResponse = await api.get("/Borrows/my-borrows");
      setBorrowHistory(historyResponse.data);
      
      alert("Borrow request cancelled successfully!");
      
    } catch (error) {
      console.error("Error cancelling borrow:", error);
      alert(error.response?.data?.message || "Failed to cancel borrow request");
    } finally {
      setActionLoading(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium";
    
    switch (status?.toLowerCase()) {
      case 'pending':
        return `${base} bg-yellow-100 text-yellow-800`;
      case 'approved':
      case 'borrowed':
        return `${base} bg-blue-100 text-blue-800`;
      case 'returned':
      case 'completed':
        return `${base} bg-green-100 text-green-800`;
      case 'overdue':
        return `${base} bg-red-100 text-red-800`;
      case 'cancelled':
      case 'rejected':
        return `${base} bg-gray-100 text-gray-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
      case 'borrowed':
        return <CheckCircle className="w-4 h-4" />;
      case 'returned':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate minimum date for extension (tomorrow)
  const getMinExtensionDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <UserSidebar active="profile" />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const displayedHistory = showAllHistory ? borrowHistory : borrowHistory.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        {/* Sidebar */}
        <UserSidebar active="profile" />

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">User Profile</h1>

            {/* Profile Statistics */}
            {profileData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {profileData.totalBorrowedBooks}
                  </div>
                  <div className="text-sm text-gray-600">Total Borrowed</div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {profileData.currentlyBorrowedBooks}
                  </div>
                  <div className="text-sm text-gray-600">Currently Borrowed</div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {profileData.returnedBooks}
                  </div>
                  <div className="text-sm text-gray-600">Returned</div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {profileData.overdueBooks}
                  </div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">User Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
                  <p className="text-gray-800">{profileData?.username || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Member Since</label>
                  <p className="text-gray-800">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Borrow History */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Borrow History</h2>
                {borrowHistory.length > 5 && (
                  <button
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showAllHistory ? 'Show Less' : 'Show All'} 
                    {showAllHistory ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </button>
                )}
              </div>

              {borrowHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No borrow history found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Book</th>
                        <th className="text-left py-3 px-4">Borrow Date</th>
                        <th className="text-left py-3 px-4">Due Date</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedHistory.map((borrow) => (
                        <tr key={borrow.borrowId} className="border-b border-gray-100">
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <img
                                src={borrow.bookCoverImage}
                                alt={borrow.bookTitle}
                                className="w-10 h-14 object-cover rounded mr-3"
                              />
                              <div>
                                <div className="font-medium text-gray-800">{borrow.bookTitle}</div>
                                <div className="text-xs text-gray-500">ID: {borrow.bookId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">{formatDate(borrow.borrowDate)}</td>
                          <td className="py-4 px-4">{formatDate(borrow.dueDate)}</td>
                          <td className="py-4 px-4">
                            <span className={getStatusBadge(borrow.status)}>
                              {getStatusIcon(borrow.status)}
                              <span className="ml-1">{borrow.status}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              {/* Extend button for active borrows */}
                              {borrow.status === 'Borrowed' && borrow.canBeExtended && (
                                <button
                                  onClick={() => handleOpenExtendForm(borrow)}
                                  disabled={actionLoading === borrow.borrowId}
                                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  {actionLoading === borrow.borrowId ? 'Extending...' : 'Extend'}
                                </button>
                              )}

                              {/* Return button for active borrows */}
                              {borrow.status === 'Borrowed' && (
                                <button
                                  onClick={() => handleReturnBook(borrow.borrowId)}
                                  disabled={actionLoading === borrow.borrowId}
                                  className="flex items-center text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {actionLoading === borrow.borrowId ? 'Returning...' : 'Return'}
                                </button>
                              )}

                              {/* Cancel button for pending requests */}
                              {borrow.status === 'Pending' && (
                                <button
                                  onClick={() => handleCancelBorrow(borrow.borrowId)}
                                  disabled={actionLoading === borrow.borrowId}
                                  className="flex items-center text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  {actionLoading === borrow.borrowId ? 'Cancelling...' : 'Cancel'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Extend Borrow Modal */}
            {extendingBorrow && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Extend Borrow Period</h3>
                    <button 
                      onClick={handleCloseExtendForm}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <img
                        src={extendingBorrow.bookCoverImage}
                        alt={extendingBorrow.bookTitle}
                        className="w-12 h-16 object-cover rounded mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-800">{extendingBorrow.bookTitle}</div>
                        <div className="text-xs text-gray-500">Current due: {formatDate(extendingBorrow.dueDate)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select New Due Date
                    </label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      min={getMinExtensionDate()}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Select a date after the current due date ({formatDate(extendingBorrow.dueDate)})
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCloseExtendForm}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExtendBorrow}
                      disabled={actionLoading === extendingBorrow.borrowId || !newDueDate}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === extendingBorrow.borrowId ? (
                        <>
                          <span className="animate-spin mr-1">⟳</span>
                          Extending...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          Extend Borrow
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity Section */}
            {profileData?.recentActivity && profileData.recentActivity.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {profileData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-800">{activity.bookTitle}</div>
                        <div className="text-sm text-gray-500">
                          Borrowed on {formatDate(activity.borrowDate)}
                        </div>
                      </div>
                      <span className={getStatusBadge(activity.status)}>
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}