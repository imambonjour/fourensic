import HistoryList from '@/components/HistoryList';

export default function HistoryPage() {
  return (
    <section className="features-section" style={{ paddingTop: '120px', minHeight: '100vh' }}>
      <div className="section-title">
        <h2>Riwayat <span className="accent-text">Konfigurasi</span></h2>
        <p>Daftar pengaturan tempat duduk sebelumnya</p>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 5%' }}>
        <HistoryList />
      </div>
    </section>
  );
}
