import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";

function App() {
  return (
    <div className="App grain">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#FFFFFF",
            color: "#0A0A0A",
            border: "2px solid #0A0A0A",
            borderRadius: "12px",
            boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
            fontWeight: 600,
          },
        }}
      />
    </div>
  );
}

export default App;
