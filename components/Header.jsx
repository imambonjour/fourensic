'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/',          label: 'Seating' },
    { href: '/history',   label: 'Riwayat' },
    { href: '/settings',  label: 'Pengaturan' },
  ];

  return (
    <header id="main-header" className="scrolled">
      <Link href="/" className="logo">
        <span className="logo-text">FOUR<span className="accent-text">ENSIC</span></span>
      </Link>

      <div
        className="mobile-menu-btn"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <i className={`fas fa-${menuOpen ? 'times' : 'bars'}`} />
      </div>

      <nav className={`nav-menu${menuOpen ? ' active' : ''}`}>
        <ul>
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                style={pathname === href ? { color: 'var(--accent)' } : {}}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
