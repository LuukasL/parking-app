import React from "react";
import {
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  LogOut,
  ArrowRightLeft,
} from "lucide-react";

const Settings = () => {
  const SettingItem = ({
    icon,
    text,
    description,
  }: {
    icon: React.ReactNode;
    text: string;
    description?: string;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px",
        borderBottom: "1px solid #e5e7eb",
        cursor: "pointer",
      }}
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
            description="Change to/from another role"
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
    </div>
  );
};

export default Settings;
