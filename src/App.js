import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import CarouselPage from "./components/CarouselPage/CarouselPage";
import Home from "./components/home/home";
import Login from "./components/login/login";
import Admin from "../src/components/admin/admin";
import Dashboard from "./components/dashboard/dashboard";
import ContactSection from "./components/contact/contact";
import AboutPage from "./components/about/about";
import User from "./components/user/user";
import ProfilePage from "./components/Profile/ProfilePage";
import NotificationComponent from "./components/notifications/notification";

function ChatbotController() {
  const location = useLocation();
  const allowedPaths = ["/", "/about", "/contact","/dashboard","/login"];

  useEffect(() => {
    const isAllowedPath = allowedPaths.includes(location.pathname);
    let script = document.querySelector("#chatling-embed-script");

    if (isAllowedPath && !script) {
      script = document.createElement("script");
      script.id = "chatling-embed-script";
      script.src = "https://chatling.ai/js/embed.js";
      script.async = true;
      script.setAttribute("data-id", "3194214117");
      script.setAttribute("data-active", "true");
      document.body.appendChild(script);
    } else if (!isAllowedPath && script) {
      script.remove();
    }

    return () => {
      if (script && !allowedPaths.includes(location.pathname)) {
        script.remove();
      }
    };
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <ChatbotController />
      <Routes>
        <Route path="/" element={<CarouselPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contact" element={<ContactSection />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/user" element={<User />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notification" element={<NotificationComponent />} />
      </Routes>
    </Router>
  );
}

export default App;
