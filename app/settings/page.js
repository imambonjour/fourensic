'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [names, setNames] = useState([]);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPw: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [clearMsg, setClearMsg] = useState(null);
  const [loadingClear, setLoadingClear] = useState(false);
  const [loadingNames, setLoadingNames] = useState(true);

  useEffect(() => {
    fetch('/api/names')
      .then(r => r.json())
      .then(data => { setNames(data); setLoadingNames(false); })
      .catch(() => setLoadingNames(false));
  }, []);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordForm.newPw !== passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'Password baru tidak cocok.' });
      return;
    }

    const res = await fetch('/api/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPw }),
    });
    const data = await res.json();
    setPasswordMsg({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
    if (res.ok) setPasswordForm({ current: '', newPw: '', confirm: '' });
  }

  async function handleClearHistory() {
    const password = prompt('Masukkan password admin untuk menghapus semua riwayat:');
    if (!password) return;

    setLoadingClear(true);
    setClearMsg(null);

    const res = await fetch('/api/settings/clear-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setClearMsg({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
    setLoadingClear(false);
  }

  async function handleExport() {
    const res = await fetch('/api/config/latest');
    const config = await res.json();
    if (!config) { alert('Tidak ada konfigurasi saat ini.'); return; }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fourensic-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleResetNames() {
    if (!confirm('Reset daftar siswa ke data default (dari kode)? Perubahan via KV akan dihapus.')) return;
    const res = await fetch('/api/settings/names', { method: 'DELETE' });
    if (res.ok) {
      const defaultRes = await fetch('/api/names');
      setNames(await defaultRes.json());
      alert('Daftar siswa direset ke default.');
    }
  }

  const males = names.filter(n => n.gender === 'L');
  const females = names.filter(n => n.gender === 'P');

  return (
    <section className="features-section" style={{ paddingTop: '120px', minHeight: '100vh' }}>
      <div className="section-title">
        <h2>Peng<span className="accent-text">aturan</span></h2>
        <p>Kelola konfigurasi dan akses admin</p>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 5%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Password ── */}
        <div className="settings-card">
          <h3 className="settings-card-title">
            <i className="fa-solid fa-key" /> Ubah Password Admin
          </h3>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="pw-current">Password Saat Ini</label>
              <input
                id="pw-current"
                type="password"
                className="form-input"
                value={passwordForm.current}
                onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label htmlFor="pw-new">Password Baru</label>
              <input
                id="pw-new"
                type="password"
                className="form-input"
                value={passwordForm.newPw}
                onChange={e => setPasswordForm(p => ({ ...p, newPw: e.target.value }))}
                required
                minLength={4}
                placeholder="Min. 4 karakter"
              />
            </div>
            <div className="form-group">
              <label htmlFor="pw-confirm">Konfirmasi Password Baru</label>
              <input
                id="pw-confirm"
                type="password"
                className="form-input"
                value={passwordForm.confirm}
                onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                required
                placeholder="Ulangi password baru"
              />
            </div>
            {passwordMsg && (
              <p className={`msg ${passwordMsg.type}`}>{passwordMsg.text}</p>
            )}
            <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
              <i className="fa-solid fa-floppy-disk" /> Simpan Password
            </button>
          </form>
        </div>

        {/* ── Data Management ── */}
        <div className="settings-card">
          <h3 className="settings-card-title">
            <i className="fa-solid fa-database" /> Manajemen Data
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="settings-action-row">
              <div>
                <p className="settings-action-label">Ekspor Konfigurasi</p>
                <p className="settings-action-desc">
                  Unduh konfigurasi tempat duduk saat ini sebagai file JSON
                </p>
              </div>
              <button className="btn btn-outline" onClick={handleExport}>
                <i className="fa-solid fa-download" /> Ekspor
              </button>
            </div>

            <div className="settings-divider" />

            <div className="settings-action-row">
              <div>
                <p className="settings-action-label" style={{ color: 'var(--destructive-bg)' }}>
                  Hapus Semua Riwayat
                </p>
                <p className="settings-action-desc">
                  Menghapus seluruh riwayat konfigurasi tempat duduk secara permanen
                </p>
              </div>
              <button
                className="btn-danger"
                onClick={handleClearHistory}
                disabled={loadingClear}
              >
                {loadingClear
                  ? 'Menghapus...'
                  : <><i className="fa-solid fa-trash" /> Hapus</>}
              </button>
            </div>

            {clearMsg && <p className={`msg ${clearMsg.type}`}>{clearMsg.text}</p>}
          </div>
        </div>

        {/* ── Student Names ── */}
        <div className="settings-card">
          <h3 className="settings-card-title">
            <i className="fa-solid fa-users" /> Daftar Siswa ({names.length} orang)
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <p className="app-subtitle" style={{ margin: 0 }}>
              Edit <code>lib/names.js</code> untuk mengubah daftar secara permanen.
            </p>
            <button className="btn btn-outline" onClick={handleResetNames} style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
              <i className="fa-solid fa-rotate-left" /> Reset ke Default
            </button>
          </div>

          {loadingNames ? (
            <p className="app-subtitle">Memuat...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontWeight: '700', color: 'var(--male-color)', marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fa-solid fa-mars" /> Laki-laki ({males.length})
                </p>
                <ul className="names-list">
                  {males.map(n => <li key={n.nama}>{n.nama}</li>)}
                </ul>
              </div>
              <div>
                <p style={{ fontWeight: '700', color: 'var(--female-color)', marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fa-solid fa-venus" /> Perempuan ({females.length})
                </p>
                <ul className="names-list">
                  {females.map(n => <li key={n.nama}>{n.nama}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ── Vercel KV Setup Guide ── */}
        <div className="settings-card settings-card-info">
          <h3 className="settings-card-title">
            <i className="fa-solid fa-circle-info" /> Panduan Setup Vercel KV
          </h3>
          <ol className="setup-guide">
            <li>
              Buka <strong>Vercel Dashboard</strong> → pilih project <code>fourensic</code>
            </li>
            <li>
              Klik tab <strong>Storage</strong> → klik <strong>Connect Database</strong>
            </li>
            <li>
              Pilih <strong>KV</strong> → klik <strong>Create New</strong> → beri nama
              (contoh: <code>fourensic-kv</code>)
            </li>
            <li>
              Pilih region terdekat → klik <strong>Create &amp; Continue</strong>
            </li>
            <li>
              Centang semua environment (<strong>Production, Preview, Development</strong>)
              → klik <strong>Connect</strong>
            </li>
            <li>
              Vercel otomatis menambahkan:<br />
              <code>KV_REST_API_URL</code>, <code>KV_REST_API_TOKEN</code>
            </li>
            <li>
              Untuk development lokal, jalankan:<br />
              <code>vercel env pull .env.local</code>
            </li>
            <li>
              Lakukan <strong>Redeploy</strong> untuk mengaktifkan KV
            </li>
          </ol>
          <div className="info-box">
            <i className="fa-solid fa-triangle-exclamation" />
            <span>
              Tanpa KV, data hanya tersimpan di memori dan akan hilang saat server restart.
              Pastikan KV sudah terhubung sebelum digunakan untuk produksi.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
