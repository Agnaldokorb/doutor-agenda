"use client";

import { CalendarIcon, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MonthOption {
  value: string;
  label: string;
}

interface MonthSelectorProps {
  options: MonthOption[];
  selectedMonth: string;
}

export default function MonthSelector({
  options,
  selectedMonth,
}: MonthSelectorProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const selectedOption = options.find(
    (option) => option.value === selectedMonth,
  );

  const handleMonthChange = (monthValue: string) => {
    router.push(`/dashboard?month=${monthValue}`);
  };

  // Mostrar um loading básico durante a hidratação
  if (!isClient) {
    return (
      <Button variant="outline" className="w-[240px] justify-start" disabled>
        <CalendarIcon className="mr-2 h-4 w-4" />
        Carregando...
      </Button>
    );
  }

  return (
    <DropdownMenu key={selectedMonth}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedOption?.label || options[0]?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[300px] w-[240px] overflow-y-auto"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleMonthChange(option.value)}
            className={cn(
              "flex items-center justify-between",
              selectedMonth === option.value && "font-medium",
            )}
          >
            {option.label}
            {selectedMonth === option.value && (
              <Check className="text-primary h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
