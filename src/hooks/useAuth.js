import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("AUTH: user signed in", firebaseUser.uid);
        setUser(firebaseUser);
        try {
          const profileDoc = await getDoc(doc(db, "profiles", firebaseUser.uid));
          console.log("AUTH: profile exists?", profileDoc.exists(), profileDoc.data());
          if (profileDoc.exists()) {
            setProfile({ id: profileDoc.id, ...profileDoc.data() });
          }
        } catch(e) {
          console.error("AUTH: profile fetch error", e.message);
        }
      } else {
        console.log("AUTH: no user");
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
