import React from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-surface rounded-lg shadow-xl p-8 border border-slate-800">
        <h1 className="text-3xl font-pretendard font-bold text-center text-sys-text mb-8">
          Refentra
        </h1>
        
        <form className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              이메일 주소
            </label>
            <Input 
              type="email" 
              placeholder="name@company.com" 
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              비밀번호
            </label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              required
            />
          </div>

          <Button type="submit" size="lg" fullWidth className="mt-4">
            로그인
          </Button>
        </form>

        <div className="mt-6 flex justify-center">
          <a href="#" className="text-sm text-text-muted hover:text-sys-text transition-colors">
            비밀번호를 잊으셨나요?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
