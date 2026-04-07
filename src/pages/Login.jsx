import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';

export default function LoginPage() {
  const [form, setForm] = useState({ email: 'admin@edu.vn', password: 'admin123' });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    if (result.success) {
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #1c1917 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      {[
        { size: 400, top: -100, left: -100, opacity: 0.06 },
        { size: 300, bottom: -80, right: -80, opacity: 0.04 },
        { size: 200, top: '40%', right: '10%', opacity: 0.03 },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: c.size, height: c.size,
            borderRadius: '50%',
            border: '1px solid rgba(245,158,11,' + c.opacity * 3 + ')',
            background: `radial-gradient(circle, rgba(245,158,11,${c.opacity}) 0%, transparent 70%)`,
            top: c.top, left: c.left, bottom: c.bottom, right: c.right,
            pointerEvents: 'none',
          }}
        />
      ))}

      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: 24,
          padding: '48px 40px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              width: 60, height: 60,
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
            }}
          >
            <GraduationCap size={28} color="#18181b" />
          </div>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 26,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 6,
            }}
          >
            EduCenter
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Hệ thống quản lý trung tâm đào tạo
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label
              className="form-label"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Email
            </label>
            <input
              className="form-control"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@edu.vn"
              required
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label
              className="form-label"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  paddingRight: 42,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={isLoading}
            style={{ justifyContent: 'center', width: '100%' }}
          >
            {isLoading ? (
              <span>Đang đăng nhập...</span>
            ) : (
              <>
                <LogIn size={17} />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 24 }}>
          EduCenter © 2025 — All rights reserved
        </p>
      </div>
    </div>
  );
}
