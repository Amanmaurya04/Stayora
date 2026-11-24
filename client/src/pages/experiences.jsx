
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { getAllExperience } from "../services/experienceServices";
import { useNavigate } from "react-router-dom";

import "../css/listing.css";
import "../css/experiences.css";

function Experiences() {
    const [experiences, setExperiences] = useState([]);
    const navigate = useNavigate();
    const [meta, setMeta] = useState({
        currentPage: 1,
        totalPages: 1,
        totalExperiences: 0,
    });

    // Layout sends { query, setQuery }
    const { query, setQuery } = useOutletContext();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch experiences from backend
    const fetchExperiences = async (nextQuery) => {
        try {
            setLoading(true);
            setError("");

            console.log("Experience query:", nextQuery);

            const { data } = await getAllExperience(nextQuery);

            console.log("Experience response:", data);

            setExperiences(data.experiences || []);

            setMeta({
                currentPage: data.currentPage || 1,
                totalPages: data.totalPages || 1,
                totalExperiences: data.totalExperiences || 0,
            });
        } catch (err) {
            console.error("Fetch experiences failed:", err);

            setError(
                "Couldn't load experiences. Check that the server is running and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch again whenever the query changes
    useEffect(() => {
        fetchExperiences(query);
    }, [query]);

    // Pagination
    const goToPage = (page) => {
        setQuery((prev) => ({
            ...prev,
            page,
        }));

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // Format price in Indian currency
    const formatPrice = (price) => {
        return Number(price || 0).toLocaleString("en-IN");
    };

    return (
        <div className="experiences-page min-vh-100 bg-white">

            <main className="sa-container container py-4 py-md-5">

                {/* Page heading */}
                <div className="experiences-header mb-4 mb-md-5">
                    <h1 className="experiences-heading">
                        Discover experiences
                    </h1>

                    <p className="experiences-description mb-0">
                        Find unique activities, explore new places,
                        and make your next outing memorable.
                    </p>
                </div>

                {/* Result count */}
                {!loading && !error && (
                    <p className="text-secondary small mb-4">
                        {meta.totalExperiences}{" "}
                        {meta.totalExperiences === 1
                            ? "experience"
                            : "experiences"}{" "}
                        found
                    </p>
                )}

                {/* Loading */}
                {loading && (
                    <div className="experiences-status py-5 text-center">
                        <div
                            className="spinner-border text-secondary"
                            role="status"
                        >
                            <span className="visually-hidden">
                                Loading...
                            </span>
                        </div>

                        <p className="text-secondary mt-3 mb-0">
                            Finding experiences for you...
                        </p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="alert alert-light border text-center py-5">
                        <h5 className="fw-semibold mb-2">
                            Experiences didn't load
                        </h5>

                        <p className="text-secondary mb-3">
                            {error}
                        </p>

                        <button
                            type="button"
                            className="btn btn-dark rounded-pill px-4"
                            onClick={() => fetchExperiences(query)}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* No experiences */}
                {!loading && !error && experiences.length === 0 && (
                    <div className="experiences-empty text-center py-5">
                        <div className="empty-icon">
                            <span aria-hidden="true">⌕</span>
                        </div>

                        <h4 className="fw-semibold mt-3">
                            No experiences found
                        </h4>

                        <p className="text-secondary mb-0">
                            Try adjusting your filters or check back later
                            for new experiences.
                        </p>
                    </div>
                )}

                {/* Experience cards */}
                {!loading && !error && experiences.length > 0 && (
                    <div className="row g-4">

                        {experiences.map((e) => {
                            const firstSchedule = e.schedule?.[0];

                            return (
                                <div
                                    className="col-12 col-sm-6 col-lg-4 col-xl-3"
                                    key={e._id}
                                >
                                    <article onClick={() => {
                                        const path = `/experiences/${e._id}`;
                                        console.log("Navigating to:", path);
                                        navigate(path);
                                    }} className="exp-card h-100">

                                        {/* Image */}
                                        <div className="exp-card-img">

                                            {e.images?.[0] ? (
                                                <img
                                                    src={e.images[0]}
                                                    alt={e.title || "Experience"}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="exp-card-fallback">
                                                    No image available
                                                </div>
                                            )}

                                            {/* Category badge */}
                                            {e.category && (
                                                <span className="exp-card-category">
                                                    {e.category}
                                                </span>
                                            )}

                                        </div>

                                        <div className="exp-card-body">

                                            {/* City, state and rating */}
                                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">

                                                <h3 className="exp-card-location mb-0">
                                                    {[
                                                        e.location?.city,
                                                        e.location?.state,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ") ||
                                                        "Location available"}
                                                </h3>

                                                {e.avgRating != null && (
                                                    <span className="exp-card-rating">
                                                        <span aria-hidden="true">
                                                            ★
                                                        </span>{" "}
                                                        {Number(e.avgRating).toFixed(1)}
                                                    </span>
                                                )}

                                            </div>

                                            {/* Experience title */}
                                            <h2 className="exp-card-title">
                                                {e.title}
                                            </h2>

                                            {/* Description */}
                                            {e.description && (
                                                <p className="exp-card-description">
                                                    {e.description}
                                                </p>
                                            )}

                                            {/* Schedule information */}
                                            {firstSchedule && (
                                                <div className="exp-card-schedule">
                                                    <span aria-hidden="true">
                                                        ◷
                                                    </span>

                                                    <span>
                                                        {firstSchedule.date}
                                                        {" · "}
                                                        {firstSchedule.startTime}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Spots left */}
                                            <p className="exp-card-spots mb-3">
                                                {firstSchedule
                                                    ? `${firstSchedule.spotsLeft ?? firstSchedule.totalSpots ?? 0} spots left`
                                                    : "Availability to be confirmed"}
                                            </p>

                                            {/* Price */}
                                            <div className="exp-card-price">
                                                <strong>
                                                    ₹{formatPrice(e.pricePerPerson)}
                                                </strong>

                                                <span> / person</span>
                                            </div>

                                        </div>

                                    </article>
                                </div>
                            );
                        })}

                    </div >
                )}

                {/* Pagination */}
                {
                    !loading && !error && meta.totalPages > 1 && (
                        <nav
                            className="exp-pagination d-flex justify-content-center align-items-center gap-3 mt-5"
                            aria-label="Experience pagination"
                        >
                            <button
                                type="button"
                                className="btn btn-outline-dark rounded-pill px-3"
                                disabled={meta.currentPage <= 1}
                                onClick={() =>
                                    goToPage(meta.currentPage - 1)
                                }
                            >
                                Previous
                            </button>

                            <span className="small text-secondary">
                                Page {meta.currentPage} of {meta.totalPages}
                            </span>

                            <button
                                type="button"
                                className="btn btn-outline-dark rounded-pill px-3"
                                disabled={
                                    meta.currentPage >= meta.totalPages
                                }
                                onClick={() =>
                                    goToPage(meta.currentPage + 1)
                                }
                            >
                                Next
                            </button>
                        </nav>
                    )
                }

            </main >

        </div >
    );
}

export default Experiences;

















































// import React, { useEffect, useState } from "react";
// import { useOutletContext } from "react-router-dom";

// import { getAllExperience } from "../services/experienceServices";

// import "../css/listing.css";

// function Experiences() {
//   const [experiences, setExperiences] = useState([]);

//   const [meta, setMeta] = useState({
//     currentPage: 1,
//     totalPages: 1,
//     totalExperiences: 0,
//   });

//   // IMPORTANT:
//   // Layout sends { query, setQuery }
//   const { query, setQuery } = useOutletContext();

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // --------------------------------
//   // FETCH EXPERIENCES
//   // --------------------------------

//   const fetchExperiences = async (nextQuery) => {
//     try {
//       setLoading(true);
//       setError("");

//       console.log("Experience query:", nextQuery);

//       const { data } = await getAllExperience(nextQuery);

//       console.log("Experience response:", data);

//       setExperiences(data.experiences || []);

//       setMeta({
//         currentPage: data.currentPage || 1,
//         totalPages: data.totalPages || 1,
//         totalExperiences: data.totalExperiences || 0,
//       });
//     } catch (err) {
//       console.error("Fetch experiences failed:", err);

//       setError(
//         "Couldn't load experiences. Check that the server is running and try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --------------------------------
//   // RUN WHEN QUERY CHANGES
//   // --------------------------------

//   useEffect(() => {
//     fetchExperiences(query);
//   }, [query]);

//   // --------------------------------
//   // PAGINATION
//   // --------------------------------

//   const goToPage = (page) => {
//     setQuery((q) => ({
//       ...q,
//       page,
//     }));

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   };

//   return (
//     <div className="min-vh-100 bg-white">

//       <main className="sa-container py-4">

//         {/* RESULT COUNT */}

//         {!loading && !error && (
//           <p className="text-secondary small mb-4">
//             {meta.totalExperiences}{" "}
//             {meta.totalExperiences === 1
//               ? "experience"
//               : "experiences"}{" "}
//             found
//           </p>
//         )}

//         {/* LOADING */}

//         {loading && (
//           <div className="py-5 text-center">
//             <div
//               className="spinner-border text-secondary"
//               role="status"
//             >
//               <span className="visually-hidden">
//                 Loading...
//               </span>
//             </div>
//           </div>
//         )}

//         {/* ERROR */}

//         {error && (
//           <div className="alert alert-light border text-center py-4">

//             <p className="fw-semibold mb-1">
//               Experiences didn't load
//             </p>

//             <p className="text-secondary mb-3">
//               {error}
//             </p>

//             <button
//               className="btn btn-dark rounded-pill px-4"
//               onClick={() => fetchExperiences(query)}
//             >
//               Try Again
//             </button>

//           </div>
//         )}

//         {/* NO EXPERIENCES */}

//         {!loading &&
//           !error &&
//           experiences.length === 0 && (

//             <div className="py-5 text-center">

//               <p className="fs-5 fw-semibold mb-1">
//                 No experiences found
//               </p>

//               <p className="text-secondary">
//                 Try a wider price range or fewer number
//                 of spots.
//               </p>

//             </div>
//           )}

//         {/* EXPERIENCE CARDS */}

//         {!loading &&
//           !error &&
//           experiences.length > 0 && (

//             <div className="row g-4">

//               {experiences.map((e) => (

//                 <div
//                   className="col-12 col-sm-6 col-lg-4 col-xl-3"
//                   key={e._id}
//                 >

//                   <article className="sa-card">

//                     {/* IMAGE */}

//                     <div className="sa-card-img">

//                       {e.images?.[0] ? (

//                         <img
//                           src={e.images[0]}
//                           alt={e.title}
//                           loading="lazy"
//                         />

//                       ) : (

//                         <div className="sa-card-fallback" />

//                       )}

//                     </div>

//                     {/* CITY + STATE + RATING */}

//                     <div className="d-flex justify-content-between align-items-start gap-2 mt-2">

//                       <h3 className="sa-card-title mb-0">

//                         {e.location?.city}

//                         {e.location?.state
//                           ? `, ${e.location.state}`
//                           : ""}

//                       </h3>

//                       {e.avgRating != null && (

//                         <span className="sa-card-rating">
//                           ★ {e.avgRating}
//                         </span>

//                       )}

//                     </div>

//                     {/* TITLE */}

//                     <p className="sa-card-sub mb-0">
//                       {e.title}
//                     </p>

//                     {/* SPOTS LEFT */}

//                     <p className="sa-card-sub mb-0">

//                       {e.schedule?.[0]?.spotsLeft ?? 0}{" "}
//                       spots left

//                     </p>

//                     {/* PRICE */}

//                     <p className="sa-card-price mb-0">

//                       <strong>
//                         ₹
//                         {Number(
//                           e.pricePerPerson
//                         ).toLocaleString("en-IN")}
//                       </strong>{" "}
//                       per person

//                     </p>

//                   </article>

//                 </div>

//               ))}

//             </div>
//           )}

//         {/* PAGINATION */}

//         {!loading &&
//           !error &&
//           meta.totalPages > 1 && (

//             <nav className="d-flex justify-content-center align-items-center gap-3 mt-5">

//               <button
//                 className="btn btn-outline-dark rounded-pill px-3"
//                 disabled={meta.currentPage <= 1}
//                 onClick={() =>
//                   goToPage(meta.currentPage - 1)
//                 }
//               >
//                 Previous
//               </button>

//               <span className="small text-secondary">
//                 Page {meta.currentPage} of{" "}
//                 {meta.totalPages}
//               </span>

//               <button
//                 className="btn btn-outline-dark rounded-pill px-3"
//                 disabled={
//                   meta.currentPage >= meta.totalPages
//                 }
//                 onClick={() =>
//                   goToPage(meta.currentPage + 1)
//                 }
//               >
//                 Next
//               </button>

//             </nav>
//           )}

//       </main>

//     </div>
//   );
// }

// export default Experiences;
































// import React, { useState, useEffect } from "react";
// import { getAllExperience } from "../services/experienceServices";
// import { useOutletContext } from "react-router-dom";
// import "../css/listing.css";

// function Experiences() {
//   const [experiences, setExperiences] = useState([]);

//   const [meta, setMeta] = useState({
//     currentPage: 1,
//     totalPages: 1,
//     totalExperiences: 0,
//   });

//   const [query, setQuery] = useOutletContext();

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const fetchExperiences = async (nextQuery) => {
//     try {
//       setLoading(true);
//       setError("");

//       const { data } = await getAllExperience(nextQuery);

//       setExperiences(data.experiences);

//       setMeta({
//         currentPage: data.currentPage,
//         totalPages: data.totalPages,
//         totalExperiences: data.totalExperiences,
//       });
//     } catch (err) {
//       console.error("Fetch experiences failed", err);

//       setError(
//         "Couldn't load experiences. Check that the server is running and try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchExperiences(query);
//   }, [query]);

//   const goToPage = (page) => {
//     setQuery((q) => ({ ...q, page }));

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   };

//   return (
//     <div className="min-vh-100 bg-white">
//       <main className="sa-container py-4">

//         {/* Result count */}
//         {!loading && !error && (
//           <p className="text-secondary small mb-4">
//             {meta.totalExperiences}{" "}
//             {meta.totalExperiences === 1 ? "experience" : "experiences"} found
//           </p>
//         )}

//         {/* Loading */}
//         {loading && (
//           <div className="py-5 text-center">
//             <div
//               className="spinner-border text-secondary"
//               role="status"
//             ></div>
//           </div>
//         )}

//         {/* Error */}
//         {error && (
//           <div className="alert alert-light border text-center py-4">
//             <p className="fw-semibold mb-1">
//               Experiences didn't load
//             </p>

//             <p className="text-secondary mb-3">
//               {error}
//             </p>

//             <button
//               className="btn btn-dark rounded-pill px-4"
//               onClick={() => fetchExperiences(query)}
//             >
//               Try Again
//             </button>
//           </div>
//         )}

//         {/* No experiences */}
//         {!loading && !error && experiences.length === 0 && (
//           <div className="py-5 text-center">
//             <p className="fs-5 fw-semibold mb-1">
//               No experiences found
//             </p>

//             <p className="text-secondary">
//               Try a wider price range or fewer number of spots.
//             </p>
//           </div>
//         )}

//         {/* Experience cards */}
//         {!loading && !error && experiences.length > 0 && (
//           <div className="row g-4">
//             {experiences.map((e) => (
//               <div
//                 className="col-12 col-sm-6 col-lg-4 col-xl-3"
//                 key={e._id}
//               >
//                 <article className="sa-card">

//                   {/* Image */}
//                   <div className="sa-card-img">
//                     {e.images?.[0] ? (
//                       <img
//                         src={e.images[0]}
//                         alt={e.title}
//                         loading="lazy"
//                       />
//                     ) : (
//                       <div className="sa-card-fallback"></div>
//                     )}
//                   </div>

//                   {/* City + Rating */}
//                   <div className="d-flex justify-content-between align-items-start gap-2 mt-2">
//                     <h3 className="sa-card-title mb-0">
//                       {e.location?.city}
//                       {e.location?.state
//                         ? `, ${e.location.state}`
//                         : ""}
//                     </h3>

//                     {e.avgRating != null && (
//                       <span className="sa-card-rating">
//                         ★ {e.avgRating}
//                       </span>
//                     )}
//                   </div>

//                   {/* Title */}
//                   <p className="sa-card-sub mb-0">
//                     {e.title}
//                   </p>

//                   {/* Guests */}
//                   <p className="sa-card-sub mb-0">
//                     {/* "schedule.spotsLeft": { $gte: 5 } spots left */}
//                   </p>

//                   {/* Price */}
//                   <p className="sa-card-price mb-0">
//                     <strong>
//                       ₹
//                       {Number(e.pricePerPerson).toLocaleString("en-IN")}
//                     </strong>{" "}
//                     per person
//                   </p>

//                 </article>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Pagination */}
//         {!loading && !error && meta.totalPages > 1 && (
//           <nav className="d-flex justify-content-center align-items-center gap-3 mt-5">

//             <button
//               className="btn btn-outline-dark rounded-pill px-3"
//               disabled={meta.currentPage <= 1}
//               onClick={() =>
//                 goToPage(meta.currentPage - 1)
//               }
//             >
//               Previous
//             </button>

//             <span className="small text-secondary">
//               Page {meta.currentPage} of {meta.totalPages}
//             </span>

//             <button
//               className="btn btn-outline-dark rounded-pill px-3"
//               disabled={
//                 meta.currentPage >= meta.totalPages
//               }
//               onClick={() =>
//                 goToPage(meta.currentPage + 1)
//               }
//             >
//               Next
//             </button>

//           </nav>
//         )}

//       </main>
//     </div>
//   );
// }

// export default Experiences;
