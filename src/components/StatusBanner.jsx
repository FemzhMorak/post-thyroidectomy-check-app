export default function StatusBanner({ dxClass, icon, title, desc }) {
  return (
    <div className={`status-banner ${dxClass}`}>
      <div className="status-icon">{icon}</div>
      <div>
        <div className="status-title">{title}</div>
        <div className="status-desc">{desc}</div>
      </div>
    </div>
  );
}
