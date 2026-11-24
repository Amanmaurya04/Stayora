
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authContext";

import React from "react";
import Layout from "./layout";

import Experiences from "./pages/experiences";
import Listings from "./pages/listings";
import ViewListing from "./pages/ViewListing";
import ViewExperience from "./pages/ViewExperience";

import CreateListing from "./pages/createListing";
import CreateExperience from "./pages/createExperience";

import EditListing from "./pages/editListing";
import EditExperience from "./pages/editExperience";

import User from "./pages/user";

import Login from "./auth/login";
import Signup from "./auth/signup";

// Protect routes that require login
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <p>Loading Stayora...</p>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Decide where the homepage should send visitors
function HomeRedirect() {
    const { user, loading } = useAuth();

    if (loading) {
        return <p>Loading Stayora...</p>;
    }

    return <Navigate to={user ? "/listings" : "/login"} replace />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<HomeRedirect />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="listings" element={<Listings />} />
                <Route path="listings/:listingId" element={<ViewListing />} />

                <Route path="experiences" element={<Experiences />} />
                <Route path="experiences/:experienceId" element={<ViewExperience />} />

                <Route path="user" element={<User />} />

                <Route path="host-home" element={<CreateListing />} />
                <Route path="host-experience" element={<CreateExperience />} />

                <Route path="listings/:listingId/edit" element={<EditListing />} />
                <Route path="experiences/:experienceId/edit" element={<EditExperience />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
