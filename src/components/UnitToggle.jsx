export default function UnitToggle({ unit, onClick }) {
  return (
    <button type="button" className="unit-toggle-btn" onClick={onClick} aria-label={`Switch unit, currently ${unit}`}>
      {unit}
    </button>
  );
}
