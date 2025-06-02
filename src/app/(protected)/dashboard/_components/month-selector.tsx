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
      <Button 
        variant="outline" 
        className="w-[240px] justify-start bg-white/90 text-white border-white/30 hover:bg-white/100 hover:text-gray-900" 
        disabled
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        Carregando...
      </Button>
    );
  }

  return (
    <DropdownMenu key={selectedMonth}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-[240px] justify-start bg-white/90 text-gray-900 border-white/30 hover:bg-white hover:text-gray-900 font-medium"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-700" />
          <span className="text-gray-900 font-medium">
            {selectedOption?.label || options[0]?.label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[300px] w-[240px] overflow-y-auto bg-white"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleMonthChange(option.value)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              selectedMonth === option.value && "bg-blue-50 font-semibold text-blue-900",
            )}
          >
            <span className="text-gray-900">
              {option.label}
            </span>
            {selectedMonth === option.value && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
