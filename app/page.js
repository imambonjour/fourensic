'use client';
import { useState, useEffect } from 'react';
import SeatingChart from '@/components/SeatingChart';
import { createSeatingPairs } from '@/lib/seating';

export default function SeatingPage() {
  const [pairs, setPairs] = useState(null);
  const [lockState, setLockState] = useState({ locked: false, unlockAt: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initSeating(false);
  }, []);

  async function initSeating(forceReshuffle) {
    setLoading(true);

    // Fetch lock status first
    const lockRes = await fetch('/api/lock');
    const lock = await lockRes.json();
    setLockState(lock);

    let seatingPairs = null;

    if (!forceReshuffle) {
      const res = await fetch('/api/config/latest');
      seatingPairs = await res.json();
    }

    if (!seatingPairs || forceReshuffle) {
      if (lock.locked) {
        alert('Konfigurasi sedang dikunci. Tidak bisa mengacak ulang.');
        setLoading(false);
        return;
      }

      const namesRes = await fetch('/api/names');
      const names = await namesRes.json();
      seatingPairs = createSeatingPairs(names);

      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seatingPairs),
      });
    }

    setPairs(seatingPairs);
    setLoading(false);
  }

  async function handleReshuffle() {
    if (lockState.locked) {
      alert('Konfigurasi sedang dikunci. Tidak bisa mengacak ulang.');
      return;
    }
    if (confirm('Apakah Anda yakin ingin mengacak ulang tempat duduk?')) {
      await initSeating(true);
    }
  }

  async function handleDownload() {
    const html2canvas = (await import('html2canvas')).default;
    const chart = document.getElementById('seating-chart');
    if (!chart) return;
    const canvas = await html2canvas(chart, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = `denah-duduk-fourensic-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function toggleLock() {
    const action = lockState.locked ? 'unlock' : 'lock';
    const label = action === 'lock' ? 'mengunci' : 'membuka kunci';
    const password = prompt(`Masukkan password admin untuk ${label}:`);
    if (password === null) return;

    const res = await fetch('/api/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, password }),
    });
    const result = await res.json();

    if (res.ok) {
      setLockState(result);
      alert(result.message);
    } else {
      alert(result.error || 'Terjadi kesalahan saat memproses kunci.');
    }
  }

  const remainingDays = lockState.locked && lockState.unlockAt
    ? Math.ceil((lockState.unlockAt - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      {loading && (
        <div id="loading-overlay">
          <div className="spinner">
            <div className="spinner-ring" />
            <span className="spinner-text">imambonjour</span>
          </div>
        </div>
      )}

      <section className="features-section" style={{ paddingTop: '120px', minHeight: '100vh' }}>
        <div className="section-title">
          <h2>Peta <span className="accent-text">Tempat Duduk</span></h2>
          <div className="header-actions" style={{ marginTop: '20px' }}>
            <button
              id="reshuffle-btn"
              className="btn"
              onClick={handleReshuffle}
              disabled={lockState.locked}
              title={lockState.locked ? 'Konfigurasi sedang dikunci' : ''}
            >
              <i className="fa-solid fa-shuffle" />
              Reshuffle Kursi
            </button>

            <button id="download-btn" className="btn btn-outline" onClick={handleDownload}>
              <i className="fa-solid fa-image" />
              Unduh Gambar
            </button>

            <button
              id="lock-btn"
              className={`btn btn-outline${lockState.locked ? ' locked' : ''}`}
              onClick={toggleLock}
            >
              <i className={`fa-solid fa-${lockState.locked ? 'lock' : 'unlock'}`} />
              <span id="lock-text">
                {lockState.locked ? `Terkunci (${remainingDays} hari lagi)` : 'Kunci'}
              </span>
            </button>
          </div>
        </div>

        <div className="seating-grid-container">
          {!loading && <SeatingChart pairs={pairs} />}
        </div>
      </section>
    </>
  );
}
