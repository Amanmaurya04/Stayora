// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// const SearchBar = () => {
//   const navigate = useNavigate();

//   const [search, setSearch] = useState("");

//   const handleSearch = () => {
//     if (!search.trim()) {
//       navigate("/listings");
//       return;
//     }

//     navigate(`/listings?search=${encodeURIComponent(search)}`);
//   };

//   return (
//     <div className="search-bar">

//       <div className="search-section">
//         <label>Where</label>

//         <input
//           type="text"
//           placeholder="Search destinations"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       <button onClick={handleSearch}>
//         🔍
//       </button>

//     </div>
//   );
// };

// export default SearchBar;