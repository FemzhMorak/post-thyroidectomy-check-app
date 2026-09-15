export default function Timeline({ items }) {
  return (
    <div className="timeline">
      {items.map((item, i) => (
        <div className="timeline-item" key={i}>
          <div className="timeline-left">
            <div className="timeline-dot" style={{ background: item.color }} />
            <div className="timeline-line" />
          </div>
          <div className="timeline-content">
            <div className="timeline-when" style={{ color: item.color }}>{item.when}</div>
            <div className="timeline-what">{item.what}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
