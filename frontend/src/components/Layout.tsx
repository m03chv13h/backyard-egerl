import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';

export default function Layout() {
  const { user, isAdmin, logout, token } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="scanline-overlay" />
      <header className="app-header">
        <Link to="/" className="logo">
          ⚡ BACKYARD EGERL
        </Link>
        <nav className="main-nav">
          {token && (
            <>
              <Link to="/events">Events</Link>
              {isAdmin && (
                <>
                  <Link to="/tag-info">Tags</Link>
                  <Link to="/scanner">Scanner</Link>
                </>
              )}
            </>
          )}
        </nav>
        <div className="header-right">
          <ThemeSwitcher />
          {user ? (
            <div className="user-info">
              <span className="username">{user.name}</span>
              <button className="btn btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm">
              Login
            </Link>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>BACKYARD EGERL TIMING SYSTEM</span>
      </footer>
    </div>
  );
}
