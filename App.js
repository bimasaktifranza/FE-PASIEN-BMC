import React, { useState, useEffect } from "react";
import { NativeRouter, Routes, Route } from "react-router-native";
import SplashScreen from "./Page/SplashScreen";
import LoginScreen from "./Page/LoginScreen/LoginScreen";
import MainScreen from "./Page/MainScreen/MainScreen";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Saat loading tampilkan SplashScreen
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NativeRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/home" element={<MainScreen />} />
      </Routes>
    </NativeRouter>
  );
}