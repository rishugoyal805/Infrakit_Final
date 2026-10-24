import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api.js";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Editor from "./pages/Editor.jsx";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    api.me().then((r) => setUser(r.user)).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="loading-screen">Loading…</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onAuth={setUser} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <Signup onAuth={setUser} />}
        />
        <Route
          path="/"
          element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Landing />}
        />
        <Route
          path="/projects/:id"
          element={user ? <Editor /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}


// import { useEffect, useState } from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { api } from "./api.js";
// import Login from "./pages/Login.jsx";
// import Signup from "./pages/Signup.jsx";
// import Dashboard from "./pages/Dashboard.jsx";
// import Editor from "./pages/Editor.jsx";

// export default function App() {
//   const [user, setUser] = useState(undefined); // undefined = loading, null = logged out

//   useEffect(() => {
//     api.me().then((r) => setUser(r.user)).catch(() => setUser(null));
//   }, []);

//   if (user === undefined) return <div className="loading-screen">Loading…</div>;

//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route
//           path="/login"
//           element={user ? <Navigate to="/" /> : <Login onAuth={setUser} />}
//         />
//         <Route
//           path="/signup"
//           element={user ? <Navigate to="/" /> : <Signup onAuth={setUser} />}
//         />
//         <Route
//           path="/"
//           element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}
//         />
//         <Route
//           path="/projects/:id"
//           element={user ? <Editor /> : <Navigate to="/login" />}
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// }
