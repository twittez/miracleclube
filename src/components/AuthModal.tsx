import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Mask functions
  const maskCPF = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPhone = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})$/, '$1-$2');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter no mínimo 6 caracteres';
    }

    if (activeTab === 'register') {
      if (!name) newErrors.name = 'Nome completo é obrigatório';
      if (!phone) newErrors.phone = 'Telefone é obrigatório';
      else if (phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Telefone inválido';
      
      if (!cpf) newErrors.cpf = 'CPF é obrigatório';
      else if (cpf.replace(/\D/g, '').length !== 11) newErrors.cpf = 'CPF inválido';
      
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'As senhas não coincidem';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Mock login/register success
      localStorage.setItem('shapewear_user_logged_in', 'true');
      localStorage.setItem('shapewear_user_name', activeTab === 'register' ? name : 'Usuário');
      // Trigger a reload or state update if this were a real app, 
      // but for now we just close the modal.
      onClose();
      // Optional: you could dispatch an event here to let Header know user logged in
      window.dispatchEvent(new Event('auth-change'));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="auth-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="auth-modal" role="dialog" aria-modal="true">
        <div className="auth-modal__card">
          <button className="auth-modal__close" onClick={onClose} aria-label="Fechar">
            <X size={24} />
          </button>
          
          <div className="auth-modal__tabs">
            <button 
              className={`auth-modal__tab ${activeTab === 'login' ? 'auth-modal__tab--active' : ''}`}
              onClick={() => { setActiveTab('login'); setErrors({}); }}
            >
              Entrar
            </button>
            <button 
              className={`auth-modal__tab ${activeTab === 'register' ? 'auth-modal__tab--active' : ''}`}
              onClick={() => { setActiveTab('register'); setErrors({}); }}
            >
              Criar Conta
            </button>
          </div>

          <div className="auth-modal__content">
            <form onSubmit={handleSubmit} noValidate>
              {activeTab === 'register' && (
                <div className="auth-modal__field">
                  <label htmlFor="name">Nome completo</label>
                  <input 
                    id="name"
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="auth-modal__error">{errors.name}</span>}
                </div>
              )}

              <div className="auth-modal__field">
                <label htmlFor="email">E-mail</label>
                <input 
                  id="email"
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="auth-modal__error">{errors.email}</span>}
              </div>

              {activeTab === 'register' && (
                <>
                  <div className="auth-modal__field">
                    <label htmlFor="phone">Telefone</label>
                    <input 
                      id="phone"
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(maskPhone(e.target.value))} 
                      className={errors.phone ? 'error' : ''}
                      maxLength={15}
                    />
                    {errors.phone && <span className="auth-modal__error">{errors.phone}</span>}
                  </div>
                  
                  <div className="auth-modal__field">
                    <label htmlFor="cpf">CPF</label>
                    <input 
                      id="cpf"
                      type="text" 
                      value={cpf} 
                      onChange={e => setCpf(maskCPF(e.target.value))} 
                      className={errors.cpf ? 'error' : ''}
                      maxLength={14}
                    />
                    {errors.cpf && <span className="auth-modal__error">{errors.cpf}</span>}
                  </div>
                </>
              )}

              <div className="auth-modal__field">
                <label htmlFor="password">Senha</label>
                <div className="auth-modal__password-wrapper">
                  <input 
                    id="password"
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className={errors.password ? 'error' : ''}
                  />
                  <button 
                    type="button" 
                    className="auth-modal__toggle-pwd" 
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="auth-modal__error">{errors.password}</span>}
              </div>

              {activeTab === 'register' && (
                <div className="auth-modal__field">
                  <label htmlFor="confirmPassword">Confirmar senha</label>
                  <input 
                    id="confirmPassword"
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="auth-modal__error">{errors.confirmPassword}</span>}
                </div>
              )}

              {activeTab === 'login' && (
                <div className="auth-modal__forgot">
                  <a href="#esqueci" onClick={(e) => e.preventDefault()}>Esqueci minha senha</a>
                </div>
              )}

              <button type="submit" className="auth-modal__submit-btn">
                {activeTab === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>

              {activeTab === 'login' && (
                <div className="auth-modal__switch">
                  Não tem uma conta? <button type="button" onClick={() => { setActiveTab('register'); setErrors({}); }}>Criar conta</button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
