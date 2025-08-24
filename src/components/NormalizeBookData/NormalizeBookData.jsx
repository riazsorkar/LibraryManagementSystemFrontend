export default function normalizeBookData(b) {
  if (!b) return null;

  return {
    id: b.bookId,
    title: b.title,
    authors: b.authorName || "Unknown",
    coverImage: b.coverImagePath,
    rating: b.averageRating || 0, // Default to 0
    ratingCount: b.totalRatings || 0, // Default to 0
    category: b.categoryName || "General",
    pdfLink: b.softCopyAvailable === "1" ? "#" : null,
    status: b.availableCopies >= 2 ? "Available" : "Not Available",
    summary: b.summary || "",
    summaryTail: null,
    availableCopies: b.availableCopies || 0,
    totalCopies: b.totalCopies || 0,
    audioSrc: b.audioFileAvailable === "1" ? "#" : null,
    hardCopyAvailable: b.hardCopyAvailable || false
  };
}