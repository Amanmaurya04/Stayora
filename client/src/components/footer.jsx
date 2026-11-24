import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "../css/footer.css";

function Footer() {
    const { user } = useAuth();

    const currentYear = new Date().getFullYear();

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="site-footer">
            <div className="site-footer-inner">

                <div className="footer-top">

                    <div className="footer-brand">
                        <Link to="/listings" className="footer-logo">
                            Stayora
                        </Link>

                        <p className="footer-tagline">
                            Find homes to stay in and experiences worth
                            remembering, all in one place.
                        </p>
                    </div>

                    <nav className="footer-column" aria-label="Explore">
                        <h4>Explore</h4>
                        <Link to="/listings">Homes</Link>
                        <Link to="/experiences">Experiences</Link>
                    </nav>

                    <nav className="footer-column" aria-label="Hosting">
                        <h4>Hosting</h4>
                        <Link to="/host-home">Stayora your home</Link>
                        <Link to="/host-experience">Host an experience</Link>
                    </nav>

                    <nav className="footer-column" aria-label="Account">
                        <h4>Account</h4>

                        {user ? (
                            <Link to="/user">My profile and bookings</Link>
                        ) : (
                            <>
                                <Link to="/login">Login</Link>
                                <Link to="/signup">Create an account</Link>
                            </>
                        )}
                    </nav>

                </div>

                <div className="footer-bottom">
                    <p>© {currentYear} Stayora. All rights reserved.</p>

                    <button
                        type="button"
                        className="footer-top-button"
                        onClick={scrollToTop}
                        aria-label="Back to top"
                    >
                        Back to top ↑
                    </button>
                </div>

            </div>
        </footer>
    );
}

export default Footer;
