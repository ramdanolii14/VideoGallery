import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import EditVideo from "./pages/EditVideo";
import "./styles.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/upload" element={<Upload />} />
          <Route path="/admin/edit/:id" element={<EditVideo />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
