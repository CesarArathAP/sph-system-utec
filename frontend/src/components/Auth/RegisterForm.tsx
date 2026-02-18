import React, { useState } from 'react';
import authService from '../../services/authService';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rol: 'docente' as 'docente' | 'admin' | 'coordinador' | 'estudiante',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authService.register({
        nombre: formData.nombre,
        apellido: formData.apellido,
        rol: formData.rol,
        email: formData.email,
        password: formData.password,
      });

      if (response.id) {
        setSuccess('¡Cuenta creada exitosamente! Redirigiendo al login...');
        setTimeout(() => { window.location.href = '/'; }, 1500);
      } else {
        setError(response.message || 'Error al crear la cuenta');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre
          </label>
          <input
            id="nombre" type="text" name="nombre"
            value={formData.nombre} onChange={handleChange}
            placeholder="Juan" required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>
        <div>
          <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-2">
            Apellido
          </label>
          <input
            id="apellido" type="text" name="apellido"
            value={formData.apellido} onChange={handleChange}
            placeholder="Pérez García" required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>
      </div>

      <div>
        <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-2">
          Rol
        </label>
        <select
          id="rol" name="rol" value={formData.rol} onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition bg-white"
        >
          <option value="docente">Docente</option>
          <option value="coordinador">Coordinador</option>
          <option value="admin">Administrador</option>
          <option value="estudiante">Estudiante</option>
        </select>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Correo Electrónico
        </label>
        <input
          id="email" type="email" name="email"
          value={formData.email} onChange={handleChange}
          placeholder="hola@utec.edu.mx" required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <input
          id="password" type="password" name="password"
          value={formData.password} onChange={handleChange}
          placeholder="••••••••" required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      <div className="text-center text-xs text-gray-500">
        ¿Ya tienes cuenta? <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">Inicia sesión aquí</a>
      </div>
    </form>
  );
}
