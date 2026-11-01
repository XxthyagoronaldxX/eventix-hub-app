import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  name: string;
  defaultValue: string;
  placeholder: string;
  children?: ReactNode;
}

export function SearchBar({ name, defaultValue, placeholder, children }: SearchBarProps) {
  return (
    <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative sm:flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={placeholder}
          className="pl-8"
        />
      </div>
      {children}
      <Button type="submit" variant="secondary">
        Buscar
      </Button>
    </form>
  );
}
