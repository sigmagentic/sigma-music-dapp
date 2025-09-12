import { confetti } from "@tsparticles/confetti";
import toast from "react-hot-toast";
import { sleep } from "./functions";

export const toastClosableError = (msg: string) => {
  toast.error(
    (t) => (
      <div className="w-[260px] overflow-auto p-2">
        <p className="text-sm">{msg}</p>
        <button className="block p-1 border text-xs rounded-sm mt-1" onClick={() => toast.dismiss(t.id)}>
          Dismiss
        </button>
      </div>
    ),
    {
      position: "top-right",
      style: {
        background: "#1A1A1A",
        color: "white",
        border: "1px solid #eab308",
        minWidth: "260px",
        fontSize: "14px",
        fontFamily: "var(--font-sans)",
      },
    }
  );
};

export const showSuccessConfetti = async () => {
  const animation = await confetti({
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    particleCount: 200,
    scalar: 2,
    shapes: ["emoji", "circle", "square"],
    shapeOptions: {
      emoji: {
        value: ["💛", "⭐", "✨", "💫", "🌟", "⚡️"],
      },
    },
  });

  if (animation) {
    await sleep(10);
    animation.stop();
    if ((animation as any).destroy) {
      (animation as any).destroy();
    }
  }
};
