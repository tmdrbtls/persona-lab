export default function Pill({ children, tone = "gray", dot = false }) {
  return (
    <span className={`pill ${tone}`}>
      {dot && <i />}
      {children}
    </span>
  );
}
