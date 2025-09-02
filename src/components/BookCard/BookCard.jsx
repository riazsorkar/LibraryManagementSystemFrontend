import { Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function BookCard({ book }) {
  const getStatus = (b) => b.status || "Available";

  // Calculate star display
  const renderStars = () => {
    const stars = [];
    const rating = book.rating || 0;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= Math.floor(rating)
              ? "text-yellow-500 fill-yellow-500"
              : i === Math.ceil(rating) && rating % 1 > 0
              ? "text-yellow-500 fill-yellow-500 opacity-50"
              : "text-gray-300"
          }`}
        />
      );
    }

    return stars;
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden min-w-[200px] sm:min-w-[200px] snap-start flex flex-col">
      {/* Image takes full top space */}
      <div className="flex-1">
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details section */}
      <div className="border-t border-gray-200 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">
            {book.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {book.category || "Category"}
          </p>
          <div className="flex items-center mt-1">
            {renderStars()}
            <span className="ml-1 text-xs text-gray-500">
              ({book.ratingCount || 0})
            </span>
          </div>
          <span
            className={`mt-2 text-xs font-medium ${
              getStatus(book) === "Available"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {getStatus(book)} ({book.availableCopies})
          </span>
        </div>

        <div className="mt-3">
          <Link
            to={`/book/${book.id}`}
            className="inline-block w-full text-center bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
