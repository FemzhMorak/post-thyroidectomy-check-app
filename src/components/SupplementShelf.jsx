export default function SupplementShelf({ supplements }) {
  const { cards, food } = supplements;

  return (
    <div className="visit-card">
      <div className="section-label">Supplements &amp; Nutrition</div>
      <div className="section-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Supplements &amp; Nutrition</div>

      <div className="supplement-shelf">
        {cards.map((c) => (
          <div className="supplement-card" key={c.name}>
            <div className="supplement-name">{c.name}</div>
            <div className="supplement-dose">{c.dose}</div>
            <div className="supplement-why">{c.why}</div>
            {c.note && <div className="supplement-note">{c.note}</div>}
            <div className="supplement-card-footer">
              <span className="supplement-timing">{c.timing}</span>
              {c.warning && <span className="supplement-warning">{c.warning}</span>}
            </div>
          </div>
        ))}
      </div>

      {food && (
        <div className="food-grid">
          <div className="food-list-block">
            <div className="food-list-title eat">Eat more</div>
            <ul className="eat-list">
              {food.eat.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
          <div className="food-list-block">
            <div className="food-list-title limit">Limit</div>
            <ul className="limit-list">
              {food.limit.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="supplement-disclaimer">Always consult your doctor before starting supplements, especially if on medication.</div>
    </div>
  );
}
