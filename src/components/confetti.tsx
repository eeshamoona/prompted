/** A quiet scatter of color on finishing. Decorative only; stays still for reduced-motion users. */
const BITS = [
  { left: "8%", top: 8, size: 8, color: "var(--primary)", round: true, delay: 0 },
  { left: "78%", top: 0, size: 6, color: "#d9b77e", round: true, delay: 80 },
  { left: "58%", top: 36, size: 10, color: "#9fc0e0", round: false, delay: 160, rotate: -25 },
  { left: "28%", top: 52, size: 6, color: "#d99bb0", round: true, delay: 40 },
  { left: "90%", top: 70, size: 9, color: "var(--primary)", round: false, delay: 200, rotate: 30 },
  { left: "44%", top: 4, size: 5, color: "#d9b77e", round: true, delay: 120 },
];

export function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24">
      {BITS.map((b, i) => (
        <span
          key={i}
          className="animate-drift absolute block"
          style={{
            left: b.left,
            top: b.top,
            width: b.round ? b.size : b.size + 4,
            height: b.round ? b.size : 4,
            borderRadius: b.round ? 999 : 2,
            background: b.color,
            rotate: `${b.rotate ?? 0}deg`,
            animationDelay: `${b.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
