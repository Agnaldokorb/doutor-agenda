"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
  autoFocus?: boolean;
  defaultValue?: string;
  debounceTime?: number;
}

export function SearchInput({
  placeholder = "Buscar...",
  paramName = "q",
  className = "",
  autoFocus = false,
  defaultValue = "",
  debounceTime = 500,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get(paramName) || defaultValue,
  );

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([name, value]) => {
        if (value === null) {
          newSearchParams.delete(name);
        } else {
          newSearchParams.set(name, value);
        }
      });

      return newSearchParams.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        router.push(
          `${pathname}?${createQueryString({ [paramName]: searchTerm })}`,
        );
      } else {
        router.push(`${pathname}?${createQueryString({ [paramName]: null })}`);
      }
    }, debounceTime);

    return () => clearTimeout(delayDebounceFn);
  }, [
    searchTerm,
    router,
    pathname,
    createQueryString,
    paramName,
    debounceTime,
  ]);

  return (
    <div className={`relative ${className}`}>
      <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9"
        autoFocus={autoFocus}
      />
    </div>
  );
}
