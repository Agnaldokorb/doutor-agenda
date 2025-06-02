"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const TestButton = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log("Botão clicado!");
    setCount((prev) => prev + 1);
    toast.success(`Botão clicado ${count + 1} vezes!`);
  };

  const handleButtonTest = () => {
    alert("Teste simples funcionou!");
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleClick} variant="outline">
        Teste ({count})
      </Button>
      <button
        onClick={handleButtonTest}
        style={{
          padding: "8px 16px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Test Simple
      </button>
    </div>
  );
};

export default TestButton;
