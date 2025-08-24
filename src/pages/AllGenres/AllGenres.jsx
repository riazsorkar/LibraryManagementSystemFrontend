// AllGenres.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import api from "../../api";
import Sidebar from "../../components/Sidebar/Sidebar";
import BookCard from "../../components/BookCard/BookCard";
import { Star } from "lucide-react";

export default function AllGenres() {
  const navigate = useNavigate();
  const location = useLocation();

  const [books, setBooks] = useState([]);
  const [bookRatings, setBookRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(location.state?.filter || null);
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  // Fetch books from API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await api.get('/Books');
        setBooks(response.data || []);
      } catch (err) {
        setError('Failed to fetch books');
        console.error('Error fetching books:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Fetch ratings for all books
  useEffect(() => {
    const fetchRatings = async () => {
      if (books.length === 0) return;

      try {
        const ratingPromises = books.map(async (book) => {
          try {
            const response = await api.get(`/Ratings/book/${book.bookId}`);
            return {
              bookId: book.bookId,
              rating: response.data
            };
          } catch (error) {
            console.error(`Error fetching rating for book ${book.bookId}:`, error);
            return {
              bookId: book.bookId,
              rating: {
                bookId: book.bookId,
                averageRating: 0,
                totalRatings: 0,
                recentReviews: []
              }
            };
          }
        });

        const ratings = await Promise.all(ratingPromises);
        const ratingsMap = {};
        ratings.forEach(rating => {
          ratingsMap[rating.bookId] = rating.rating;
        });
        setBookRatings(ratingsMap);
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };

    fetchRatings();
  }, [books]);

  const allBooks = useMemo(() => {
    return books.map(book => ({
      id: book.bookId,
      title: book.title,
      summary: book.summary,
      coverImage: book.coverImagePath,
      hardCopyAvailable: book.hardCopyAvailable,
      softCopyAvailable: book.softCopyAvailable,
      audioFileAvailable: book.audioFileAvailable,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      author: book.authorName,
      category: book.categoryName,
      rating: bookRatings[book.bookId]?.averageRating || 0,
      totalRatings: bookRatings[book.bookId]?.totalRatings || 0
    }));
  }, [books, bookRatings]);

  useEffect(() => {
    if (location.state?.filter !== undefined) setFilter(location.state.filter);
  }, [location.state]);

  const filtered = useMemo(() => {
    if (!filter || filter.type === "all") return allBooks;
    
    if (filter.type === "categories" && Array.isArray(filter.categories)) {
      if (filter.categories.length === 0) return allBooks;
      
      return allBooks.filter(book => 
        filter.categories.some(category => 
          book.category?.toLowerCase() === category.toLowerCase()
        )
      );
    }
    
    return allBooks;
  }, [filter, allBooks]);

  // Keep page valid
  useEffect(() => setPage(1), [filter]);
  const totalPages = Math.max(1, Math.ceil((filtered?.length || 0) / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar onSelect={setFilter} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-gray-500">Loading books...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar onSelect={setFilter} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar onSelect={setFilter} />

      {/* Book Grid */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">All Genres</h1>

        <div className="rounded-lg border border-gray-300 overflow-hidden bg-white">
          <div className="px-4 py-3 bg-white">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Browse Books ({filtered.length} books found)
            </h2>
          </div>

          <div className="border-t border-gray-200 p-4">
            {pageItems.length ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No books found.</div>
            )}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && totalPages > 1 && (
            <div className="px-4 pb-4 flex items-center justify-between gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 text-sm rounded-md border ${
                      n === page
                        ? "bg-sky-600 text-white border-sky-600"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                    aria-current={n === page ? "page" : undefined}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}