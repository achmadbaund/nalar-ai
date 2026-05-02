"use client";

import { useState } from "react";
import {
  Database,
  Info,
  GitBranch,
  Scale,
  Upload,
  Cpu,
  Zap,
  RefreshCw,
} from "lucide-react";
import ServiceInfo from "./service-info";
import ModelList from "./model-list";
import ModelVersions from "./model-versions";
import ModelCompare from "./model-compare";
import ModelRegister from "./model-register";
import ConvertOnnx from "./convert-onnx";
import QuantizeModel from "./quantize-model";
import HotSwap from "./hot-swap";

const tabs = [
  { id: "service-info", label: "Service Info", icon: Info },
  { id: "model-list", label: "Models", icon: Database },
  { id: "model-versions", label: "Versions", icon: GitBranch },
  { id: "model-compare", label: "Compare", icon: Scale },
  { id: "model-register", label: "Register", icon: Upload },
  { id: "convert-onnx", label: "Convert ONNX", icon: Cpu },
  { id: "quantize-model", label: "Quantize", icon: Zap },
  { id: "hot-swap", label: "Hot-Swap", icon: RefreshCw },
];

export default function ModelManagement() {
  const [activeTab, setActiveTab] = useState("service-info");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Model Management</h2>
        <p className="text-muted-foreground">Manage ML model registry, versions, and operations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "service-info" && <ServiceInfo />}
        {activeTab === "model-list" && <ModelList />}
        {activeTab === "model-versions" && <ModelVersions />}
        {activeTab === "model-compare" && <ModelCompare />}
        {activeTab === "model-register" && <ModelRegister />}
        {activeTab === "convert-onnx" && <ConvertOnnx />}
        {activeTab === "quantize-model" && <QuantizeModel />}
        {activeTab === "hot-swap" && <HotSwap />}
      </div>
    </div>
  );
}
