"use client";

import { FileText, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButtons() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2">
        <FileText className="size-4" />
        <span className="hidden sm:inline">Exportar</span> PDF
      </Button>
      <Button variant="outline" size="sm" className="gap-2">
        <Sheet className="size-4" />
        <span className="hidden sm:inline">Exportar</span> CSV
      </Button>
    </div>
  );
}
