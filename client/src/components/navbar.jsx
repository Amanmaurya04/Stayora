
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext"
import "../css/navbar.css";

export default function Navbar({ onSearch = () => { } }) {
 const { user, logout } = useAuth();
    const [ city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [guests, setGuests] = useState(0);
  const [spotsLeft, setSpotsLeft] = useState(0);

  const [active, setActive] = useState(null);

  const barRef = useRef(null);
  const menuRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isExperiencePage =
    location.pathname.startsWith("/experiences");

  const isListingPage =
    location.pathname.startsWith("/listings");


  useEffect(() => {

    // const handleDown = (e) => {

    //   if (
    //     barRef.current &&
    //     !barRef.current.contains(e.target)
    //   ) {
    //     setActive(null);
    //   }

    // };


const handleDown = (e) => {
        const clickedInsideSearch =
            barRef.current?.contains(e.target);

        const clickedInsideMenu =
            menuRef.current?.contains(e.target);

        if (!clickedInsideSearch && !clickedInsideMenu) {
            setActive(null);
        }
    };




    const handleKey = (e) => {

      if (e.key === "Escape") {
        setActive(null);
      }

    };

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);

    return () => {

      document.removeEventListener(
        "mousedown",
        handleDown
      );

      document.removeEventListener(
        "keydown",
        handleKey
      );

    };

  }, []);



  const handleSearch = () => {

    const query = {
      page: 1,
      limit: 30,
    };




    if (city.trim()) {
      query.city = city.trim();
    }

    if (minPrice) {
      query.minPrice = Number(minPrice);
    }



    if (maxPrice) {
      query.maxPrice = Number(maxPrice);
    }



    if (isListingPage && guests > 0) {
      query.maxGuest = guests;
    }



    if (isExperiencePage && spotsLeft > 0) {
      query.spotsLeft = spotsLeft;
    }

    setActive(null);

    onSearch(query);
  };



  // const handleLogout = () => {
  //   logout();
  //   navigate("/login");
  // };

  const handleLogout = () => {
    console.log("LOGOUT BUTTON CLICKED");

    logout();

    console.log("AFTER LOGOUT");

    navigate("/login");
  };



  const clearAll = () => {

    setCity("");
    setMinPrice("");
    setMaxPrice("");

    setGuests(0);
    setSpotsLeft(0);

    setActive(null);

    onSearch({
      page: 1,
      limit: 30,
    });
  };



  const priceLabel =
    minPrice || maxPrice
      ? `₹${minPrice || "0"} – ₹${maxPrice || "any"}`
      : "Add price";

  const guestLabel =
    guests > 0
      ? `${guests} guest${guests > 1 ? "s" : ""}`
      : "Add guests";

  const spotsLabel =
    spotsLeft > 0
      ? `${spotsLeft} spot${spotsLeft > 1 ? "s" : ""}`
      : "Add spots";



  const peopleActive =
    isListingPage
      ? active === "guests"
      : active === "spots";


  return (

    <header className="navbar-wrapper">

      <nav className="nv">

        <div className="container-fluid">

          <div className="row align-items-center">


            <div className="col-lg-3 col-md-2 col-4">

              <div className="logo-wrapper">

                <Link
                  className="title text-decoration-none"
                  to="/listings"
                >
                  Stayora
                </Link>

              </div>

            </div>


            <div className="col-lg-6 col-md-8 col-8">


              <div className="nav-category-row">

                <NavLink
                  to="/listings"
                  className="nav-link"
                >

                  <img
                    src="/images/house.png"
                    alt="Homes"
                  />

                  <span className="nv-text">
                    Homes
                  </span>

                </NavLink>


                <NavLink
                  to="/experiences"
                  className="nav-link"
                >

                  <img
                    src="/images/hot-air-balloon.png"
                    alt="Experiences"
                  />

                  <span className="nv-text">
                    Experiences
                  </span>

                </NavLink>

              </div>



              <div
                ref={barRef}
                className="search-bar"
              >



                <div
                  className={`search-section where-section ${active === "city"
                    ? "search-section-active"
                    : ""
                    }`}
                  onClick={() => setActive("city")}
                >

                  <input
                    className="w-input"
                    value={city}
                    onChange={(e) =>
                      setCity(e.target.value)
                    }
                    onFocus={() =>
                      setActive("city")
                    }
                    onKeyDown={(e) => {

                      if (e.key === "Enter") {
                        handleSearch();
                      }

                    }}
                    placeholder="Where"
                  />

                </div>


                <span
                  className={`sa-divider ${active === "city" ||
                    active === "price"
                    ? "hide"
                    : ""
                    }`}
                />


                <div
                  className={`search-section price-section ${active === "price"
                    ? "search-section-active"
                    : ""
                    }`}
                >

                  <button
                    type="button"
                    className="price-box"
                    onClick={() =>
                      setActive(
                        active === "price"
                          ? null
                          : "price"
                      )
                    }
                  >

                    <span className="label">
                      Price
                    </span>

                    <span
                      className={
                        minPrice || maxPrice
                          ? "filled"
                          : ""
                      }
                    >
                      {priceLabel}
                    </span>

                  </button>


                  {active === "price" && (

                    <div className="price-dropdown">

                      <h5 className="fw-semibold text-center mb-4">
                        Price
                      </h5>


                      <div className="price-input-row">

                        <PriceField
                          label="Minimum"
                          value={minPrice}
                          onChange={setMinPrice}
                        />

                        <span className="price-dash">
                          –
                        </span>

                        <PriceField
                          label="Maximum"
                          value={maxPrice}
                          onChange={setMaxPrice}
                        />

                      </div>


                      <div className="price-chips-wrapper">

                        {[
                          ["Under ₹2000", "", "2000"],
                          ["₹2000–5000", "2000", "5000"],
                          ["₹5000–10000", "5000", "10000"],
                          ["₹10,000+", "10000", ""],
                        ].map(
                          ([label, lo, hi]) => (

                            <button
                              key={label}
                              type="button"
                              className="price-chips"
                              onClick={() => {

                                setMinPrice(lo);
                                setMaxPrice(hi);

                              }}
                            >
                              {label}
                            </button>

                          )
                        )}

                      </div>


                      <button
                        type="button"
                        className="clear-price-btn "
                        onClick={() => {

                          setMinPrice("");
                          setMaxPrice("");

                        }}
                      >
                        Clear price
                      </button>

                    </div>

                  )}

                </div>


                <span
                  className={`sa-divider ${active === "price" ||
                    peopleActive
                    ? "hide"
                    : ""
                    }`}
                />




                <div
                  className={`search-section people-section ${peopleActive
                    ? "search-section-active"
                    : ""
                    }`}
                >

                  <div className="people-content">

                    <button
                      type="button"
                      className="guest-search-btn"
                      onClick={() =>
                        setActive(
                          peopleActive
                            ? null
                            : isListingPage
                              ? "guests"
                              : "spots"
                        )
                      }
                    >

                      <span className="people-label">
                        {isListingPage
                          ? "Guests"
                          : "Spots"}
                      </span>

                      <span
                        className={
                          (
                            isListingPage
                              ? guests
                              : spotsLeft
                          ) > 0
                            ? "filled"
                            : ""
                        }
                      >
                        {isListingPage
                          ? guestLabel
                          : spotsLabel}
                      </span>

                    </button>


                    {/* SEARCH BUTTON */}

                    <button
                      type="button"
                      className="navbar-search-btn"
                      onClick={handleSearch}
                      aria-label="Search"
                    >
                      <SearchIcon />
                    </button>

                  </div>




                  {isListingPage &&
                    active === "guests" && (

                      <div className="people-dropdown">

                        <h5 className="fw-semibold">
                          Guests
                        </h5>

                        <div className="people-row">

                          <div>

                            <div className="fw-semibold">
                              Guests
                            </div>

                            <small className="text-secondary">
                              How many people?
                            </small>

                          </div>


                          <div className="counter">

                            <button
                              type="button"
                              className="minus-plus-btn"
                              disabled={guests <= 0}
                              onClick={() =>
                                setGuests(
                                  Math.max(
                                    0,
                                    guests - 1
                                  )
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {guests}
                            </span>

                            <button
                              type="button"
                              className="minus-plus-btn"
                              onClick={() =>
                                setGuests(
                                  guests + 1
                                )
                              }
                            >
                              +
                            </button>

                          </div>

                        </div>


                        <button
                          type="button"
                          className="clear-all-btn"
                          onClick={clearAll}
                        >
                          Clear all
                        </button>

                      </div>

                    )}




                  {isExperiencePage &&
                    active === "spots" && (

                      <div className="people-dropdown">

                        <h5 className="fw-semibold">
                          Spots needed
                        </h5>

                        <div className="people-row">

                          <div>

                            <div className="fw-semibold">
                              People
                            </div>

                            <small className="text-secondary">
                              Number of spots needed
                            </small>

                          </div>


                          <div className="counter">

                            <button
                              type="button"
                              className="minus-plus-btn"
                              disabled={
                                spotsLeft <= 0
                              }
                              onClick={() =>
                                setSpotsLeft(
                                  Math.max(
                                    0,
                                    spotsLeft - 1
                                  )
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {spotsLeft}
                            </span>

                            <button
                              type="button"
                              className="minus-plus-btn"
                              onClick={() =>
                                setSpotsLeft(
                                  spotsLeft + 1
                                )
                              }
                            >
                              +
                            </button>

                          </div>

                        </div>


                        <button
                          type="button"
                          className="clear-all-btn"
                          onClick={clearAll}
                        >
                          Clear all
                        </button>

                      </div>

                    )}

                </div>

              </div>

            </div>




            <div className="col-lg-3 col-md-2 d-none d-md-block">

              <div className="right-navbar">

                {/* HOST LINK */}


{isListingPage && (  <Link
                  to="/host-home"
                  className="host-link"
                >
                  Stayora your home
                </Link>   ) }


               
{isExperiencePage && (  <Link
                  to="/host-experience"
                  className="host-link"
                >
                  Host an Experience
                </Link>   ) }


                {/* MENU + PROFILE */}


<div
    ref={menuRef}
    className="profile-menu-container"
>
                <div type="button"
                  className="profile-menu-btn"
                  aria-label="Open menu">


                  <button className="right-butns" onClick={() => setActive(active === "menu" ? null : "menu")}>

                    <i className="fa-solid fa-bars"></i>

                  </button>




                  <button className="right-butns" onClick={() => setActive(active === "profile" ? null : "profile")} >

                    <i className="fa-solid fa-user"></i>

                  </button>

                </div>

                {active === "menu" && (
                  <div className="menu-dropdown">
                  

                    <button
                      type="button"
                      onClick={() => {
                        console.log("LOGOUT CLICKED");
                        handleLogout();
                      }}
                      className="logout-btn p-1"
                    >
                      Logout
                    </button>


                  </div>

                )} 



{active === "profile" && (
  <div className="profile-dropdown">
    <button className="profile-btn p-1" onClick={() => navigate("/user")}>Profile</button>
  </div>
)}


                </div>
                


              </div>

            </div>

          </div>

        </div>

      </nav>

    </header>
  );
}


/* =====================================================
   PRICE FIELD
===================================================== */

function PriceField({
  label,
  value,
  onChange,
}) {

  return (

    <label className="price-field-label">

      <span className="sa-price-label">
        {label}
      </span>

      <div className="price-input-wrapper">

        <span>₹</span>

        <input
          className="price-feild-input"
          type="number"
          min="0"
          placeholder="0"
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />

      </div>

    </label>

  );
}


/* =====================================================
   SEARCH ICON
===================================================== */

const SearchIcon = () => (

  <svg
    className="search-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
  >

    <circle
      cx="11"
      cy="11"
      r="7"
    />

    <path
      d="M20 20l-3.5-3.5"
    />

  </svg>

);


