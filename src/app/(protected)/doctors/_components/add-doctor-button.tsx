"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const AddDoctorButton = () => {
  return (
    <Link href="/doctors/new">
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        Adicionar médico
      </Button>
    </Link>
  );
};

export default AddDoctorButton;
