// FillUpForm.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import api from "../../api";
import normalizeBookData from "../../components/NormalizeBookData/NormalizeBookData";

export default function FillUpForm() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [formData, setFormData] = useState({
    returnDate: "",
    days: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Helper: compute whole-day difference from TODAY to return date
  const calcBorrowDays = (returnDateStr) => {
    if (!returnDateStr) return 0;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const rtn = new Date(returnDateStr);
    const end = new Date(rtn.getFullYear(), rtn.getMonth(), rtn.getDate());
    const diffMs = end - start;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/Books/${id}`);
        const normalizedBook = normalizeBookData(res.data);
        setBook(normalizedBook);
      } catch (err) {
        console.error("Error fetching book:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchBook();
    }
  }, [id]);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "returnDate") {
      const autoDays = calcBorrowDays(value);
      setFormData({
        ...formData,
        returnDate: value,
        days: autoDays,
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Submit borrow request
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Format the due date in ISO format as required by API
      const dueDate = new Date(formData.returnDate);
      dueDate.setHours(23, 59, 59, 999);
      
      const borrowData = {
        bookId: parseInt(id),
        dueDate: dueDate.toISOString()
      };

      await api.post("/Borrows/borrow", borrowData);
      
      alert("Book borrowed successfully!");
      navigate("/UserDashboard");
      
    } catch (err) {
      console.error("Error creating borrow request:", err);
      alert(err.response?.data?.message || "Failed to borrow book. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Loading book details...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        {/* Sidebar */}
        {/* <aside className="hidden md:block w-64 flex-none">
          <Sidebar />
        </aside> */}

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Book Borrow Form</h1>

            {book ? (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-32 h-48 object-contain rounded border border-gray-200"
                  />

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{book.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">by {book.authors}</p>
                    <p className="text-sm text-gray-500 mb-4">Category: {book.category}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Return Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <CalendarDays className="w-4 h-4 inline mr-1" />
                          Return Date
                        </label>
                        <input
                          type="date"
                          name="returnDate"
                          className="text-gray-900 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          value={formData.returnDate}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      {/* Borrowing Days */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Borrowing Duration
                        </label>
                        <div className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50">
                          <span className="text-gray-700">
                            {formData.days > 0 ? `${formData.days} days` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <p className="text-gray-600">Book not found.</p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={!formData.returnDate || submitting}
                className="bg-sky-500 hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-md transition-colors"
              >
                {submitting ? "Processing..." : "Borrow Book"}
              </button>
            </div>

            
          </div>
        </main>
      </div>
    </div>
  );
}