import React, { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSwitchToRegister = () => {
    setIsRegistering(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegistering(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        {isRegistering ? (
          <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
        ) : (
          <LoginForm onSwitchToRegister={handleSwitchToRegister} />
        )}
      </div>
    </div>
  );
};

export default LoginPage;