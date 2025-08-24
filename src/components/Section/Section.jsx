// // components/Section/Section.jsx
// import BookCard from "../BookCard/BookCard";

// export default function Section({ title, books }) {
//   return (
//     <div className="mb-12">
//       <h2 className="text-lg font-bold mb-4">{title}</h2>

//       {/* Switched to a responsive grid with generous spacing.
//          - 2 columns on small screens, 3 on md, 4 on lg+
//          - Large horizontal & vertical gaps
//          - Center each fixed-width BookCard within its cell */}
//       <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center gap-x-12 sm:gap-x-14 lg:gap-x-20 gap-y-10 lg:gap-y-14">
//         {books.map((book) => (
//           <BookCard
//             key={book.id}          // ✅ ensure a stable key
//             id={book.id}
//             title={book.title}
//             author={book.author}
//             image={book.image}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }



// // components/Section/Section.jsx
// import BookCard from "../BookCard/BookCard";

// export default function Section({ title, books = [] }) {
//   const items = (books || []).slice(0, 4); // keep only 4 cards

//   return (
//     <div className="mb-12">
//       <h2 className="text-lg font-bold mb-4">{title}</h2>

//       {/* Responsive horizontal strip:
//           - Mobile: 2 full cards visible
//           - md+: 3 full cards visible
//           - Total of 4 cards in list */}
//       <div
//         className="
//           flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory
//           px-1 py-1 hide-scrollbar
//           [scrollbar-width:none] [-ms-overflow-style:none]
//         "
//         style={{ WebkitOverflowScrolling: "touch" }}
//       >
//         <style>{`
//           .hide-scrollbar::-webkit-scrollbar { display: none; }
//         `}</style>

//         {items.map((book) => (
//           <div
//             key={book.id}
//             className="
//               snap-start shrink-0
//               flex-[0_0_50%] md:flex-[0_0_33.333%] /* mobile: 2 cards; md+: 3 cards */
//               min-w-0 flex justify-center
//             "
//           >
//             <BookCard
//               id={book.id}
//               title={book.title}
//               author={book.author}
//               image={book.image}
//             />
//           </div>
//         ))}

//         {/* Padding so last card fully shows */}
//         <div className="shrink-0 pr-2" />
//       </div>
//     </div>
//   );
// }


// components/Section/Section.jsx
import BookCard from "../BookCard/BookCard";

export default function Section({ title, books = [] }) {
  const items = (books || []).slice(0, 4); // keep only 4 cards

  return (
    <div className="mb-12">
      <h2 className="text-lg font-bold mb-4">{title}</h2>

      {/* Responsive horizontal strip:
          - Mobile: 2 full cards visible
          - md (tablet): 2 full cards visible (no half 3rd card)
          - lg+ (desktop): 3 full cards visible
          - Total of 4 cards in list */}
      <div
        className="
          flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory items-stretch
          px-1 py-1 hide-scrollbar
          [scrollbar-width:none] [-ms-overflow-style:none]
        "
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>

        {items.map((book) => (
          <div
            key={book.id}
            className="
              snap-start shrink-0
              [flex-basis:calc(50%-1rem)]               /* mobile: 2 cards, gap-8 => 1rem half-gap */
              md:[flex-basis:calc(50%-1rem)]            /* tablet: 2 cards (no half 3rd) */
              lg:[flex-basis:calc((100%-4rem)/3)]       /* desktop: 3 cards, gap-8 => 2 gaps = 4rem */
              min-w-0 flex justify-start
            "
          >
            <BookCard
              id={book.id}
              title={book.title}
              author={book.author}
              image={book.image}
            />
          </div>
        ))}

        {/* Padding so last card fully shows */}
        <div className="shrink-0 pr-2" />
      </div>
    </div>
  );
}
