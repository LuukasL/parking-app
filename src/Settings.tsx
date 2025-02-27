import React, { useState } from "react";
import {
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  LogOut,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { useUser, UserRole } from "./UserContext";

const Settings = () => {
  const { role, setRole } = useUser();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const SettingItem = ({
    icon,
    text,
    description,
    onClick,
  }: {
    icon: React.ReactNode;
    text: string;
    description?: string;
    onClick?: () => void;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px",
        borderBottom: "1px solid #e5e7eb",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "16px",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "500" }}>{text}</div>
        {description && (
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            {description}
          </div>
        )}
      </div>
    </div>
  );

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setIsRoleModalOpen(false);
  };

  return (
    <div
      style={{
        height: "100%",
        backgroundColor: "#f9fafb",
        overflow: "auto",
      }}
    >
      <div
        style={{
          padding: "20px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          Settings
        </h1>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <SettingItem
            icon={<Bell size={24} color="#6b7280" />}
            text="Notifications"
            description="Manage your notification preferences"
          />
          <SettingItem
            icon={<Shield size={24} color="#6b7280" />}
            text="Privacy & Security"
            description="Control your privacy settings"
          />
          <SettingItem
            icon={<CreditCard size={24} color="#6b7280" />}
            text="Payment Methods"
            description="Manage your payment options"
          />
          <SettingItem
            icon={<HelpCircle size={24} color="#6b7280" />}
            text="Help & Support"
          />
          <SettingItem
            icon={<ArrowRightLeft size={24} color="#6b7280" />}
            text="Change roles"
            description={`Current role: ${
              role.charAt(0).toUpperCase() + role.slice(1)
            }`}
            onClick={() => setIsRoleModalOpen(true)}
          />
          <SettingItem
            icon={<LogOut size={24} color="#ef4444" />}
            text="Log Out"
          />
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          App Version 1.0.0
        </p>
      </div>

      {/* Role Switch Modal */}
      {isRoleModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setIsRoleModalOpen(false)}
              style={{
                position: "absolute",
                right: "12px",
                top: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} color="#6b7280" />
            </button>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              Switch Roles
            </h3>

            <p style={{ marginBottom: "20px" }}>
              Select your role in the parking app:
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={() => handleRoleChange("user")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: role === "user" ? "#3b82f6" : "white",
                  color: role === "user" ? "white" : "black",
                  fontWeight: "500",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                User (find and rent parking spots)
              </button>

              <button
                onClick={() => handleRoleChange("owner")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: role === "owner" ? "#3b82f6" : "white",
                  color: role === "owner" ? "white" : "black",
                  fontWeight: "500",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Owner (rent out your parking spots)
              </button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <button
                onClick={() => setIsRoleModalOpen(false)}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
