
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/authContext";

import React from "react";
import Layout from "./layout";

import Experiences from "./pages/experiences";
import Listings from "./pages/listings";
// import ViewListing from "./pages/ViewListing";


import ViewListing from "./pages/ViewListing";
import ViewExperience from "./pages/ViewExperience";


import CreateListing from "./pages/createListing";
import CreateExperience from "./pages/createExperience";

import EditListing from "./pages/editListing";
import EditExperience from "./pages/editExperience";

import User from "./pages/user";

import Login from "./auth/login";
import Signup from "./auth/signup";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>

                    <Route element={<Layout />}>

                        <Route path="/" element={<Listings />} />

                        <Route path="/listings" element={<Listings />} />

                        {/* <Route
                            path="/listings/:id"
                            element={<ViewListing />}
                        /> */}

                        <Route path="/listings/:listingId" element={<ViewListing />} />
                        <Route path="/experiences/:experienceId" element={<ViewExperience />} />


                        <Route
                            path="/experiences"
                            element={<Experiences />}
                        />

                    </Route>

                    <Route path="/login" element={<Login />} />

                    <Route path="/signup" element={<Signup />} />

                    <Route path="/host-home" element={<CreateListing />} />

                    <Route path="/host-experience" element={<CreateExperience />} />

                    <Route path="/listings/:listingId/edit" element={<EditListing />} />

                    <Route
                        path="/experiences/:experienceId/edit"
                        element={<EditExperience />}
                    />
                    <Route path="/user" element={<User />} />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

