/**
 * SeatingChart — pure display component, works on both the main page and inside
 * the history modal. Accepts `pairs` as [[name1, name2, gender], ...].
 */
export default function SeatingChart({ pairs, containerId = 'seating-chart' }) {
  if (!pairs || pairs.length === 0) {
    return (
      <p className="app-subtitle" style={{ textAlign: 'center', padding: '40px 0' }}>
        Belum ada konfigurasi tempat duduk.
      </p>
    );
  }

  return (
    <div className="seating-grid" id={containerId}>
      {pairs.map((pair, idx) => {
        const [name1, name2, gender] = pair;
        return (
          <div key={idx} className={`table-card ${gender}`}>
            <SeatItem name={name1} gender={gender} />
            <SeatItem name={name2} gender={gender} />
          </div>
        );
      })}
    </div>
  );
}

function SeatItem({ name, gender }) {
  const isEmpty = name === '—';
  return (
    <div className={`seat-item${isEmpty ? ' empty-seat' : ''}`}>
      <span className="seat-label">
        {gender === 'L' ? 'Laki-laki' : 'Perempuan'}
      </span>
      <span className="seat-name">{name}</span>
    </div>
  );
}
