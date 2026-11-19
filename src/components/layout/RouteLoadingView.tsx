import { ViraChaveLoader } from "@/components/motion/ViraChaveLoader";
import { cn } from "@/lib/cn";

export interface RouteLoadingViewProps {
  fullScreen?: boolean;
  label?: string;
}

export function RouteLoadingView({
  fullScreen = false,
  label = "Carregando conteúdo...",
}: RouteLoadingViewProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center bg-[var(--bg-canvas)]/70 backdrop-blur-sm",
        fullScreen ? "min-h-screen" : "min-h-[60vh] rounded-2xl",
      )}
    >
      <ViraChaveLoader size={88} label={label} />
    </div>
  );
}
