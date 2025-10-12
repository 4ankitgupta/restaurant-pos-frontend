import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface OrderTimerProps {
  createdAt: string;
}

export function OrderTimer({ createdAt }: OrderTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = new Date(createdAt).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const getUrgencyColor = () => {
    if (elapsed < 300) return "text-success"; // < 5 min
    if (elapsed < 600) return "text-warning"; // 5-10 min
    return "text-destructive"; // > 10 min
  };

  const getBorderColor = () => {
    if (elapsed < 300) return "border-success"; // < 5 min
    if (elapsed < 600) return "border-warning"; // 5-10 min
    return "border-destructive"; // > 10 min
  };

  return (
    <div className={`flex items-center gap-1 ${getUrgencyColor()}`}>
      <Clock className="h-4 w-4" />
      <span className="font-mono font-semibold">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

export function useOrderBorderColor(createdAt: string) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = new Date(createdAt).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  if (elapsed < 300) return "border-success"; // < 5 min
  if (elapsed < 600) return "border-warning"; // 5-10 min
  return "border-destructive"; // > 10 min
}
