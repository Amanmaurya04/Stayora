import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "../css/auth.css";
import { Link } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    contact: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await signup(formData);

      setMessage(data.message || "Account created successfully");

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (


    <div className="auth-page d-flex justify-content-center align-items-center p-3">

      <div className="auth-overlay"></div>

      <div className="signup-container rounded-4 ">

        <div className="title d-flex justify-content-center p-3 fs-1 fw-medium"> Stayora</div>

        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Enter your username
            </label>

            <input
              name="username"
              type="text"
              className="form-control"
              id="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Enter Email
            </label>

            <input
              className="form-control"
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>


          <div className="mb-3">
            <label htmlFor="contact" className="form-label">
              Enter a valid contact number.
            </label>

            <input
              className="form-control"
              id="contact"
              type="number"
              name="contact"
              placeholder="Mobile number"
              value={formData.contact}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Create Password
            </label>

            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Password must be of 6 characters"
            />
          </div>


<div className="d-flex justify-content-center">


          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
</div>

<div className="p-1">Already have an account?<Link to="/login" className="text-decoration-none" >Login</Link></div>

          {error && <p className="text-danger" >{error}</p>}
          {message && <p className="text-success">{message}</p>}
        </form>

      </div>

    </div>

  )

}


export default Signup; 
