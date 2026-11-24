
import React from "react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

function Layout() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 30,
  });

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
  };

  return (
    <>
      <Navbar onSearch={handleSearch} />

      <Outlet
        context={{
          query,
          setQuery,
        }}
      />

      <Footer />
    </>
  );
}

export default Layout;
































// import React from "react";
// import { useState } from "react";
// import { Outlet } from "react-router-dom";
// import Navbar from "./components/navbar";
// import Footer from "./components/footer";

// function Layout() {
//   const [query, setQuery] = useState({
//     page: 1,
//     limit: 30,
//   });

//   const handleSearch = (searchQuery) => {
//     setQuery(searchQuery);
//   };
  
//   return (
//     <>
//       <Navbar onSearch={handleSearch} />

//       <Outlet
//         context={{
//           query,
//           setQuery,
//         }}
//       />

//       <Footer />
//     </>
//   );
// }

// export default Layout;