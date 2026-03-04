import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/home', icon: '🏠', label: 'Home' },
  { to: '/wallet', icon: '👛', label: 'Wallet' },
  { to: '/refuel', icon: '⚡', label: 'Refuel' },
  { to: '/statements', icon: '📄', label: 'Statements' },
  { to: '/payment', icon: '💳', label: 'Pay' },
];

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      height: 'var(--nav-height)',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      zIndex: 100,
      boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
    }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            padding: '8px 4px',
            transition: 'color 0.2s',
          })}
        >
          {({ isActive }) => (
            <>
              <span style={{ fontSize: 22 }}>{tab.icon}</span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.3px',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {tab.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  width: 32,
                  height: 3,
                  background: 'var(--primary)',
                  borderRadius: '2px 2px 0 0',
                }} />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
