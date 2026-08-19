import React, { useState, useEffect } from "react";
import { User, ShoppingBag, Menu, LogOut, Package, Search } from "lucide-react";
import { brand } from "../config/brand";
import { MobileMenu } from "./MobileMenu";
import { useCart } from "../contexts/CartContext";
import "./Header.css";

interface HeaderProps {
  onCartClick?: () => void;
  onAuthClick?: () => void;
  onOpenCategory?: (category: string) => void;
  onTrackingClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onCartClick, 
  onAuthClick,
  onOpenCategory,
  onTrackingClick
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getItemCount } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(localStorage.getItem('shapewear_user_logged_in') === 'true');
      setUserName(localStorage.getItem('shapewear_user_name') || '');
    };
    
    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('shapewear_user_logged_in');
    localStorage.removeItem('shapewear_user_name');
    setIsLoggedIn(false);
    setUserMenuOpen(false);
  };

  const navLinks = [
    { label: "Cinta Body", href: "#product-section" },
    { label: "Combos", href: "#product-section" },
    { label: "Linha Plus Size", href: "#product-section" },
    { label: "Nossos Queridinhos", href: "#product-section" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const elem = document.querySelector(".product-main-section");
      if (elem) elem.scrollIntoView({ behavior: "smooth" });
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="site-header">
        {/* Main Header Row */}
        <div className="site-header__inner">
          {/* Left Actions: Hamburger + Search */}
          <div className="site-header__left-actions">
            <button
              type="button"
              className="site-header__icon-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu principal"
            >
              <Menu size={22} />
            </button>
            <button
              type="button"
              className="site-header__icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Buscar produtos"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Brand Logo */}
          <a href="/" className="site-header__logo">
            <img src="/images/logo.png" alt={brand.name} className="site-header__logo-img" />
          </a>

          {/* Right Actions: Account + Cart */}
          <div className="site-header__actions">
            <div className="site-header__user-container">
              <button 
                type="button" 
                className="site-header__icon-btn" 
                aria-label="Minha Conta"
                onClick={() => {
                  if (isLoggedIn) {
                    setUserMenuOpen(!userMenuOpen);
                  } else {
                    if (onAuthClick) onAuthClick();
                  }
                }}
              >
                <User size={20} />
              </button>

              {isLoggedIn && userMenuOpen && (
                <div className="site-header__user-dropdown">
                  <div className="site-header__user-dropdown-header">
                    <p>Olá, <strong>{userName}</strong></p>
                  </div>
                  <ul>
                    <li><a href="#minha-conta"><User size={16}/> Minha Conta</a></li>
                    <li><a href="#pedidos"><Package size={16}/> Meus Pedidos</a></li>
                    <li><button onClick={handleLogout}><LogOut size={16}/> Sair</button></li>
                  </ul>
                </div>
              )}
            </div>

            <button 
              type="button"
              className="site-header__icon-btn site-header__cart-btn" 
              aria-label="Carrinho de compras"
              onClick={onCartClick}
            >
              <ShoppingBag size={20} />
              <span className="site-header__cart-badge">{getItemCount()}</span>
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown Toggle */}
        {searchOpen && (
          <form className="site-header__search-bar" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Buscar por body, cinta, tamanho..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" aria-label="Pesquisar">
              <Search size={18} />
            </button>
          </form>
        )}

        {/* Sub-navigation Categories Bar */}
        <nav className="site-header__subnav">
          <ul className="site-header__subnav-list">
            {navLinks.map((link, idx) => (
              <li key={idx} className="site-header__subnav-item">
                <a 
                  href={link.href}
                  className="site-header__subnav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenCategory) onOpenCategory(link.label);
                    const elem = document.querySelector(".product-main-section");
                    if (elem) elem.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Mobile Drawer Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks}
        onTrackingClick={onTrackingClick}
      />
    </>
  );
};
