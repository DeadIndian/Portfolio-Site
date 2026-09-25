"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      className="button button-primary"
      onClick={() => window.print()}
    >
      <Printer size={16} />
      Print / Save PDF
    </button>
  );
}
