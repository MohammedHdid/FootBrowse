"use client";

import { useEffect, useState } from "react";

interface Props {
  utcTime: string; // e.g. "15:00"
  date: string;    // e.g. "2024-04-19"
}

export default function LocalMatchTime({ utcTime, date }: Props) {
  const [localTime, setLocalTime] = useState<string | null>(null);

  useEffect(() => {
    // We do this in useEffect to avoid hydration mismatch (Server has no timezone, Client does)
    try {
      const [hours, minutes] = utcTime.split(":").map(Number);
      const utcDate = new Date(`${date}T${utcTime}:00Z`);
      
      if (isNaN(utcDate.getTime())) {
        setLocalTime(utcTime);
        return;
      }

      const formatted = utcDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      
      setLocalTime(formatted);
    } catch (e) {
      setLocalTime(utcTime);
    }
  }, [utcTime, date]);

  // Fallback to UTC during server-render or if logic fails
  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {localTime || utcTime}
    </span>
  );
}
