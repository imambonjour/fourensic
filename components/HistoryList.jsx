'use client';
import { useState, useEffect } from 'react';
import SeatingChart from '@/components/SeatingChart';

function formatDate(tsStr) {
  if (!tsStr) return tsStr;
  if (tsStr.includes('_')) {
    const [dmy, hms] = tsStr.split('_');
    const [d, m, y] = dmy.split('-');
    const [h, min, s] = hms.split('-');
    const date = new Date(y, m - 1, d, h, min, s || 0);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
    }
  }
  return tsStr.replace(/_/g, ' ');
}

export default function HistoryList() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(data => { setHistory(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function showLayout(filename, dateStr) {
    const res = await fetch(`/api/history/${filename}`);
    const config = await res.json();
    setModal({ title: dateStr, pairs: config });
  }

  async function restoreConfig(filename, dateStr) {
    if (!confirm(`Apakah Anda yakin ingin mengembalikan konfigurasi dari ${dateStr}?`)) return;
    const res = await fetch(`/api/history/${filename}/restore`, { method: 'POST' });
    if (res.ok) {
      alert('Konfigurasi berhasil dikembalikan! Mengalihkan ke halaman utama...');
      window.location.href = '/';
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Gagal: ${err.details || err.error || 'Kesalahan tidak diketahui'}`);
    }
  }

  if (loading) {
    return <p className="app-subtitle" style={{ textAlign: 'center', marginTop: '40px' }}>Memuat...</p>;
  }

  if (history.length === 0) {
    return <p className="app-subtitle" style={{ textAlign: 'center', marginTop: '40px' }}>Belum ada riwayat konfigurasi.</p>;
  }

  return (
    <>
      <div className="history-list">
        {history.map(item => {
          const dateStr = formatDate(item.timestamp);
          return (
            <div
              key={item.filename}
              className="history-item"
              onClick={() => showLayout(item.filename, dateStr)}
            >
              <div className="history-info">
                <span className="history-date">{dateStr}</span>
                <span className="history-file">{item.filename}</span>
              </div>
              <div className="history-action">
                <span
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px' }}
                  onClick={e => { e.stopPropagation(); showLayout(item.filename, dateStr); }}
                >
                  Lihat Layout
                </span>
                <span
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px' }}
                  onClick={e => { e.stopPropagation(); restoreConfig(item.filename, dateStr); }}
                >
                  Gunakan Ini
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div
          className="modal"
          style={{ display: 'block' }}
          onClick={() => setModal(null)}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setModal(null)}>&times;</span>
            <header className="app-header">
              <h2 className="app-title">Layout Konfigurasi</h2>
              <p className="app-subtitle">{modal.title}</p>
            </header>
            <SeatingChart pairs={modal.pairs} containerId="modal-seating-chart" />
          </div>
        </div>
      )}
    </>
  );
}
