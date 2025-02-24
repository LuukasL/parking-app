import React from "react";
import { MapPin, User, Settings } from "lucide-react";

export interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        backgroundColor: "black",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
        zIndex: 1000,
      }}
    >
      <button
        onClick={() => onTabChange("home")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "none",
          border: "none",
          color: activeTab === "home" ? "#3b82f6" : "#6b7280",
          cursor: "pointer",
          padding: "8px 16px",
        }}
      >
        <MapPin size={24} />
        <span style={{ fontSize: "12px", marginTop: "4px" }}></span>
      </button>

      <button
        onClick={() => onTabChange("profile")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "none",
          border: "none",
          color: activeTab === "profile" ? "#3b82f6" : "#6b7280",
          cursor: "pointer",
          padding: "8px 16px",
        }}
      >
        <User size={24} />
        <span style={{ fontSize: "12px", marginTop: "4px" }}></span>
      </button>

      <button
        onClick={() => onTabChange("settings")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "none",
          border: "none",
          color: activeTab === "settings" ? "#3b82f6" : "#6b7280",
          cursor: "pointer",
          padding: "8px 16px",
        }}
      >
        <Settings size={24} />
        <span style={{ fontSize: "12px", marginTop: "4px" }}></span>
      </button>
    </div>
  );
};

export default BottomNav;
