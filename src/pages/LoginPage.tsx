import { type FormEvent, useState } from 'react';
import '../App.css';

type LoginPageProps = {
  onLogin: () => void;
  onForgotPassword: () => void;
};

export function LoginPage({ onLogin, onForgotPassword }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username.trim().toLowerCase() === 'nexvg' && password === 'Nexvg@2026') {
      setError('');
      onLogin();
      return;
    }

    setError('Usuário ou senha inválidos.');
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <p className="login-eyebrow">Acesso restrito</p>
        <h1>Entrar no Nexvg Manager</h1>
        <p className="login-subtitle">Entre com suas credenciais para acessar o dashboard.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Usuário</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Digite o usuário"
              autoComplete="username"
            />
          </label>

          <label className="login-field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite a senha"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button type="submit" className="login-button">
            Entrar
          </button>

          <button type="button" className="login-secondary-button" onClick={onForgotPassword}>
            Trocar senha
          </button>
        </form>
      </div>
    </section>
  );
}
