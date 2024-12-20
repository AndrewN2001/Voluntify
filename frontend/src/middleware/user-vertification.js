import React, {useState, useContext, createContext, useEffect} from "react";

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({children}) => {
    const [isLoggedIn, setLoggedIn] = useState(false);
    // const [loggedUser, setLoggedUser] = useState(null);
    const [loggedUser, setLoggedUser] = useState({
        name: null,
        userID: null,
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("loggedUser")
        const storedAdmin = localStorage.getItem("isAdmin");
        if (storedUser) {
            // console.log(storedUser);
            const user = JSON.parse(storedUser);
            setLoggedUser({
                name: user.name,
                userID: user.userID,
            })

            setLoggedIn(true);
            if (storedAdmin === "true"){
                setIsAdmin(true);
            } else{
                setIsAdmin(false);
            }
        }
        setLoading(false);
    }, []);

    const login = (name, userID, attendedEvents) => {
        setLoggedIn(true);
        setLoggedUser({
            name: name,
            userID: userID,
        });
        localStorage.setItem("loggedUser", JSON.stringify({
            name: name,
            userID: userID,
        }));
    }

    const logout = () => {
        setLoggedIn(false);
        setLoggedUser(null);
        setIsAdmin(false);
        localStorage.removeItem("loggedUser");
        localStorage.removeItem("isAdmin");
    }

    const setAdmin = (state) => {
        setIsAdmin(state);
        localStorage.setItem("isAdmin", state ? "true": "false");
    }

    return(
        <AuthContext.Provider value={{isLoggedIn, loggedUser, login, logout, setIsAdmin, isAdmin, setAdmin}}>
            {!loading && children}
        </AuthContext.Provider>
    )
}