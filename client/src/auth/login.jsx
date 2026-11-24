import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "../css/auth.css";

const Login = () => {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login({ email, password });

      navigate("/listings");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Login failed. Please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  return (

<div className="auth-page  d-flex justify-content-center align-items-center p-3">

<div className="login-container rounded-4 ">
        <div className="title d-flex justify-content-center p-3 fs-1 fw-medium">Stayora</div>
        <h4 className="fw-medium p-1">Enter your credentials</h4>


<form onSubmit={handleSubmit}>

      <div className="mb-3">
        <label htmlFor="email" className="form-label p-1">
         Enter your email.
        </label>

        <input
          type="email"
          className="form-control p-2"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@gmail.com"
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="password" className="form-label p-1">
        Enter your password.
        </label>

        <input
          type="password"
          className="form-control p-2"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="abcd123"
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary w-100 p-2"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {error && <p className="text-danger">{error}</p>}

      <div className="auth-switch-link p-1">
        New here? <Link className="text-decoration-none " to="/signup">Create an account</Link>
      </div>

    </form>

</div>

</div>

  );
};

export default Login;
