import React, { useState } from "react";
import "./styles.css";
import ParkingMap from "./ParkingMap";
import BottomNav from "./BottomNav";
import Profile from "./Profile";
import Settings from "./Settings";

function App() {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <ParkingMap />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      default:
        return <ParkingMap />;
    }
  };
  // Palautus
  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: "64px",
          backgroundColor: "#f9fafb",
        }}
      >
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
