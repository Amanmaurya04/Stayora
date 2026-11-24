import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    loginUser,
    signupUser
} from "../services/authServices";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            const storedToken = localStorage.getItem("token");

            if (storedUser && storedToken) {
                const parsedUser = JSON.parse(storedUser);

                if (parsedUser && typeof parsedUser === "object") {
                    setUser(parsedUser);
                    setToken(storedToken);
                } else {
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                }
            } else {

                localStorage.removeItem("user");
                localStorage.removeItem("token");
            }
        } catch (error) {
            console.error("Error restoring login session:", error);

            localStorage.removeItem("user");
            localStorage.removeItem("token");

            setUser(null);
            setToken(null);
        } finally {
            setLoading(false);
        }
    }, []);


    const login = async (credentials) => {
        const data = await loginUser(credentials);

        if (!data.token || !data.user) {
            throw new Error("Invalid login response from server");
        }


        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));


        setToken(data.token);
        setUser(data.user);

        return data;
    };


    const signup = async (formData) => {
        return await signupUser(formData);
    };


    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                signup,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthContext;
