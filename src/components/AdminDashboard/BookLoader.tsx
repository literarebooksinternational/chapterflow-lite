// src/components/AdminDashboard/BookLoader.tsx
import React from 'react';
import './BookLoader.css'; // Importa os estilos que criamos

const BookLoader = () => {
  return (
    <div className="book-loader-container">
      <div className="book">
        <div className="inner">
          <div className="left"></div>
          <div className="middle"></div>
          <div className="right"></div>
        </div>
        <ul>
          {/* Gera as 18 páginas (<li>) necessárias para a animação */}
          {Array.from({ length: 18 }).map((_, index) => (
            <li key={index}></li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BookLoader;