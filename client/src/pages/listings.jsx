import { useEffect, useState } from "react";

import { getAllListings } from "../services/listingServices";
import "../css/listing.css";
import { useOutletContext, useNavigate } from "react-router-dom";

const Listings = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1, totalListings: 0 });
  const { query, setQuery } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchListings = async (nextQuery) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getAllListings(nextQuery);
      setListings(data.listings);
      setMeta({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalListings: data.totalListings,
      });
    } catch (err) {
      console.error("Fetch listings failed:", err);
      setError("Couldn't load listings. try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(query);
  }, [query]);


  const goToPage = (page) => {
    setQuery((q) => ({ ...q, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="listing-page min-vh-100 bg-white">

      <main className="sa-container container py-4 py-md-5">


        <div className="listing-header mb-4 mb-md-5">
          <h1 className="listing-heading">Discover Stays</h1>

          <p className="listing-description mb-0">
            Find Stays, explore new places,
            and make your next stay memorable.
          </p>

        </div>


        {!loading && !error && (
          <p className="text-secondary small mb-4">
            {meta.totalListings}{" "}
            {meta.totalListings === 1
              ? "Listing"
              : "Listings"}{" "}
            found
          </p>
        )}


        {loading && (
          <div className="listing-status py-5 text-center">
            <div className="spinner-border text-secondary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary mt-3 mb-0">
              Finding Listings for you...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-light border text-center py-5">
            <h5 className="fw-semibold mb-2">
              Listings didn't load
            </h5>
            <p className="text-secondary mb-3">{error}</p>

            <button
              type="button"
              className="btn btn-dark rounded-pill px-4"
              onClick={() => fetchListings(query)}
            >Try again</button>

          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="listing-empty text-center py-5">
            <div className="empty-icon">
              <span>⌕</span>
            </div>
            <h4 className="fw-semibold mt-3">No Listings found</h4>

            <p className="text-secondary mb-0">
              Try adjusting your filters or check back later
              for new Listings.
            </p>

          </div>
        )}


        {!loading && !error && listings.length > 0 && (
          <div className="row g-4">
            {listings.map((e) => {
              return (
                <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={e._id}>

                  <article onClick={() => navigate(`/listings/${e._id}`)} className="li-card h-100">
                    <div className="li-card-img">
                      {e.images?.[0] ? (
                        <img src={e.images[0]} alt={e.title || "Listing"} loading="lazy" />
                      ) : (
                        <div className="li-card-fallback">
                          No image available
                        </div>
                      )}
                    </div>

                    <div className="li-card-body">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">

                        <h3 className="li-card-location mb-0">
                          {[
                            e.location?.city,
                            e.location?.state
                          ].filter(Boolean).join(",") ||
                            "Location available"}

                        </h3>

                        {e.avgRating != null && (
                          <span className="li-card-rating">
                            <span aria-hidden="true">
                              ★
                            </span>{" "}
                            {Number(e.avgRating).toFixed(1)}
                          </span>
                        )}
                      </div>


                      <h2 className="li-card-title">{e.title}</h2>

                      {e.description && (
                        <p className="li-card-description"> {e.description}</p>
                      )}


                      {e.maxGuest && (
                        <p className="exp-card-spots mb-3">
                       Maximum guests:  {e.maxGuest}
                        </p>
                      )}


                        < div className="li-card-price">
                      <strong>
                        ₹{e.pricePerNight}
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


{
  !loading && !error && meta.totalPages > 1 && (
    <nav className="li-pagination d-flex justify-content-centeralign-items-center gap-3 mt-5"
      aria-label="Experience pagination">

      <button
        type="button"
        className="btn btn-outline-dark rounded-pill px-3"
        disabled={meta.currentPage <= 1}
        onClick={() =>
          goToPage(meta.currentPage - 1)
        }
      >Previous</button>
      <span className="small text-secondary">
        Page {meta.currentPage} of {meta.totalPages}
      </span>

      <button
        type="button"
        className="btn btn-outline-dark rounded-pill px-3"
        disabled={meta.currentPage >= meta.totalPages}
        onClick={() => goToPage(meta.currentPage + 1)}
      >Next</button>

    </nav>
  )
}

      </main >

    </div >


  )

}

export default Listings
